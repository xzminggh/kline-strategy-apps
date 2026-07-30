import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import { Buffer } from 'buffer';

export interface Stock {
  code: string;
  name: string;
  market: string;
  sectorId: string;
  status: string;
}

export interface KlineDaily {
  code: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
}

export interface DatabaseImportResult {
  success: boolean;
  backupPath?: string;
  error?: string;
  stockCount?: number;
}

export type ImportProgressCallback = (stage: string, current: number, total: number) => void;

export interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null;
  isConnected: boolean;
  isLoading: boolean;
  getTables: () => Promise<string[]>;
  getStockCount: () => Promise<number>;
  getKlineCount: () => Promise<number>;
  getStocks: () => Promise<Stock[]>;
  getKlineByCode: (code: string) => Promise<KlineDaily[]>;
  getMeta: () => Promise<Record<string, string>>;
  importDatabase: (fileUri: string, onProgress?: ImportProgressCallback) => Promise<DatabaseImportResult>;
  getBackupList: () => Promise<string[]>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within SQLiteProvider');
  }
  return context;
};

const DB_NAME = 'kline.sqlite';
const DB_DIR = `${FileSystemLegacy.documentDirectory}SQLite/`;

/**
 * [wb修改] 数据库 schema 版本（用 PRAGMA user_version 标记）。
 * v0 = 旧格式/被污染的演示库（volume 为「手」或混合单位）；
 * v>=1 = volume 已统一为「万手」。
 * 启动时对 v0 库原地转万手（÷10000）并置版本，保证数据格式彻底统一、自愈污染旧库；不删数据。
 */
const SCHEMA_VERSION = 1;

/**
 * [wb修改] 一次性迁移：把 volume 从「手」统一转为「万手」（÷10000，保留2位），并写入 schema 版本。
 * 幂等：仅当 user_version < SCHEMA_VERSION 时执行；已迁移库直接跳过，不会二次缩放。
 */
const migrateVolumeToWanShou = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return;
  // 空库/尚未导入时 kline_daily 表不存在，跳过转换避免 "no such table" 报错；
  // 不写 user_version，等真正导入含 kline_daily 的库时再由本函数统一转万手。
  const tbl = await database.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table' AND name='kline_daily'"
  );
  if (!tbl || tbl.cnt === 0) return;
  await database.execAsync(
    'UPDATE kline_daily SET volume = ROUND(volume / 10000.0, 2) WHERE volume > 0;'
  );
  await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
};

export const SQLiteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // [wb修改] 跟踪当前存活的原生句柄，查询时按调用时刻取值，避免 StrictMode 双挂载导致的 stale 闭包竞态
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);

  const copyDatabase = async () => {
    const localDbPath = `${DB_DIR}${DB_NAME}`;
    const assetDbPath = `${FileSystemLegacy.bundleDirectory}kline_1y_smalldemo.sqlite`;

    const localExists = await FileSystemLegacy.getInfoAsync(localDbPath);
    if (!localExists.exists) {
      const assetExists = await FileSystemLegacy.getInfoAsync(assetDbPath);
      if (assetExists.exists) {
        await FileSystemLegacy.makeDirectoryAsync(DB_DIR, { intermediates: true });
        await FileSystemLegacy.copyAsync({
          from: assetDbPath,
          to: localDbPath,
        });
      }
    }
    return localDbPath;
  };

  useEffect(() => {
    const initDatabase = async () => {
      setIsLoading(true);
      try {
        await FileSystemLegacy.makeDirectoryAsync(DB_DIR, { intermediates: true });
        await copyDatabase(); // 仅当本地缺失且存在 seed 时拷贝；Expo Go 无 seed 时落为空库

        const database = await SQLite.openDatabaseAsync(DB_NAME, {}, DB_DIR.replace(/\/$/, ''));
        try {
          await migrateVolumeToWanShou(database); // 原地转万手 + 置版本（幂等、安全，不删数据）
        } catch (mErr) {
          console.error('Volume migration failed (data may be in old unit):', mErr);
        }
        dbRef.current = database;
        setDb(database);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initDatabase();

    // [wb修改] StrictMode 双挂载/真卸载时关闭连接，避免悬挂句柄导致 "Access to closed resource"
    return () => {
      const handle = dbRef.current;
      dbRef.current = null;
      setDb(null);
      setIsConnected(false);
      if (handle) {
        handle.closeAsync().catch(() => {});
      }
    };
  }, []);

  const getTables = async (): Promise<string[]> => {
    const database = dbRef.current;
    if (!database) return [];
    try {
      const rows = await database.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      return rows.map((r) => r.name);
    } catch (error: any) {
      const msg = String(error?.message || error || '');
      // 重挂载期间的良性竞态（表不存在 / 句柄已关）不刷红控制台
      if (!msg.includes('no such table') && !msg.includes('closed resource')) {
        console.error('getTables failed:', error);
      }
      return [];
    }
  };

  const getStockCount = async (): Promise<number> => {
    const database = dbRef.current;
    if (!database) return 0;
    try {
      const row = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM stocks'
      );
      return row?.count || 0;
    } catch (error: any) {
      const msg = String(error?.message || error || '');
      if (!msg.includes('no such table') && !msg.includes('closed resource')) {
        console.error('getStockCount failed:', error);
      }
      return 0;
    }
  };

  const getKlineCount = async (): Promise<number> => {
    const database = dbRef.current;
    if (!database) return 0;
    try {
      const row = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM kline_daily'
      );
      return row?.count || 0;
    } catch (error: any) {
      const msg = String(error?.message || error || '');
      if (!msg.includes('no such table') && !msg.includes('closed resource')) {
        console.error('getKlineCount failed:', error);
      }
      return 0;
    }
  };

  const getStocks = async (): Promise<Stock[]> => {
    const database = dbRef.current;
    if (!database) return [];
    try {
      const rows = await database.getAllAsync<Stock>(
        'SELECT code, name, market, sector_id AS sectorId, status FROM stocks'
      );
      return rows;
    } catch (error: any) {
      const msg = String(error?.message || error || '');
      if (!msg.includes('closed resource')) {
        console.error('getStocks failed:', String(error?.message || error));
      }
      return [];
    }
  };

  const getKlineByCode = async (code: string): Promise<KlineDaily[]> => {
    const database = dbRef.current;
    if (!database) return [];
    try {
      const rows = await database.getAllAsync<KlineDaily>(
        'SELECT code, date, open, high, low, close, volume, amount FROM kline_daily WHERE code = ? ORDER BY date ASC',
        [code]
      );
      return rows;
    } catch (error: any) {
      const msg = String(error?.message || error || '');
      if (!msg.includes('closed resource')) {
        console.error('getKlineByCode failed:', String(error?.message || error));
      }
      return [];
    }
  };

  const getMeta = async (): Promise<Record<string, string>> => {
    const database = dbRef.current;
    if (!database) return {};
    try {
      const rows = await database.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM meta'
      );
      const meta: Record<string, string> = {};
      for (const row of rows) {
        meta[row.key] = row.value;
      }
      return meta;
    } catch (error: any) {
      const msg = String(error?.message || error || '');
      if (!msg.includes('no such table') && !msg.includes('closed resource')) {
        console.error('getMeta failed:', error);
      }
      return {};
    }
  };

  const importDatabase = async (fileUri: string, onProgress?: ImportProgressCallback): Promise<DatabaseImportResult> => {
    const STAGES = [
      { name: '准备导入', weight: 1 },
      { name: '备份当前数据库', weight: 2 },
      { name: '复制新数据库文件', weight: 3 },
      { name: '打开数据库连接', weight: 1 },
      { name: '数据迁移校验', weight: 2 },
      { name: '完成导入', weight: 1 },
    ];
    const totalWeight = STAGES.reduce((sum, s) => sum + s.weight, 0);
    
    let progress = 0;
    const reportProgress = (stageIndex: number) => {
      const prevWeight = STAGES.slice(0, stageIndex).reduce((sum, s) => sum + s.weight, 0);
      progress = prevWeight + STAGES[stageIndex].weight;
      onProgress?.(STAGES[stageIndex].name, progress, totalWeight);
    };

    try {
      reportProgress(0); // 准备导入
      const localDbPath = `${DB_DIR}${DB_NAME}`;
      const timestamp = Date.now();
      const backupPath = `${DB_DIR}kline_backup_${timestamp}.sqlite`;

      // 关闭当前数据库连接
      if (db) {
        await db.closeAsync();
        dbRef.current = null;
        setDb(null);
        setIsConnected(false);
      }

      await FileSystemLegacy.makeDirectoryAsync(DB_DIR, { intermediates: true });

      reportProgress(1); // 备份当前数据库
      const localExists = await FileSystemLegacy.getInfoAsync(localDbPath);
      let createdBackup = '';
      if (localExists.exists) {
        await FileSystemLegacy.copyAsync({
          from: localDbPath,
          to: backupPath,
        });
        createdBackup = backupPath;
      }

      reportProgress(2); // 复制新数据库文件
      await FileSystemLegacy.copyAsync({
        from: fileUri,
        to: localDbPath,
      });

      reportProgress(3); // 打开数据库连接
      const newDb = await SQLite.openDatabaseAsync(DB_NAME, {}, DB_DIR.replace(/\/$/, ''));
      
      reportProgress(4); // 数据迁移校验
      try {
        await migrateVolumeToWanShou(newDb);
      } catch (mErr) {
        console.error('Imported DB volume migration failed (data may be in old unit):', mErr);
      }
      
      // 查询新数据库的股票数量
      let stockCount = 0;
      try {
        const row = await newDb.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM stocks');
        stockCount = row?.cnt ?? 0;
      } catch (e) {
        // stocks表可能不存在，忽略
      }
      
      dbRef.current = newDb;
      setDb(newDb);
      setIsConnected(true);

      reportProgress(5); // 完成导入
      return { success: true, backupPath: createdBackup || undefined, stockCount };
    } catch (error: any) {
      console.error('Failed to import database:', error);
      return { success: false, error: error?.message || '未知错误' };
    }
  };

  const getBackupList = async (): Promise<string[]> => {
    try {
      const dirInfo = await FileSystemLegacy.readDirectoryAsync(DB_DIR);
      const backups = dirInfo
        .filter((name) => name.startsWith('kline_backup_') && name.endsWith('.sqlite'))
        .sort()
        .reverse()
        .map((name) => `${DB_DIR}${name}`);
      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  };

  const value: DatabaseContextType = {
    db,
    isConnected,
    isLoading,
    getTables,
    getStockCount,
    getKlineCount,
    getStocks,
    getKlineByCode,
    getMeta,
    importDatabase,
    getBackupList,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
