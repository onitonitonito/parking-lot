"""
데이터베이스 모듈
SQLite3를 사용하여 차량 탐지 결과를 저장하고 관리합니다.
"""

import sqlite3
import os
from datetime import datetime

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'parking.db')


def get_db_connection():
    """데이터베이스 연결을 반환합니다."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """데이터베이스 테이블을 초기화합니다."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_filename TEXT NOT NULL,
            upload_path TEXT NOT NULL,
            result_path TEXT NOT NULL,
            car_count INTEGER NOT NULL,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()


def save_detection(original_filename, upload_path, result_path, car_count):
    """탐지 결과를 데이터베이스에 저장합니다."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO detections (original_filename, upload_path, result_path, car_count)
        VALUES (?, ?, ?, ?)
    ''', (original_filename, upload_path, result_path, car_count))
    
    detection_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return detection_id


def get_all_detections():
    """모든 탐지 기록을 최신순으로 반환합니다."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, original_filename, upload_path, result_path, car_count, detected_at
        FROM detections
        ORDER BY detected_at DESC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_detection_by_id(detection_id):
    """특정 ID의 탐지 기록을 반환합니다."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, original_filename, upload_path, result_path, car_count, detected_at
        FROM detections
        WHERE id = ?
    ''', (detection_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None


def delete_detection(detection_id):
    """특정 ID의 탐지 기록을 삭제합니다."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM detections WHERE id = ?', (detection_id,))
    
    conn.commit()
    conn.close()
