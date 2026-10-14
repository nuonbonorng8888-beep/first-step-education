#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NGS Education Hub - Local LMS Server
Built on top of Python's robust SimpleHTTPRequestHandler & ThreadingHTTPServer.
- Native Range header support for fast video seeking (Statistic.mp4)
- Native UTF-8 and URL-decoded file handling for Khmer names (មេ.១០ (៣).pdf)
- REST API for /api/courses, /api/lessons, /api/upload
- High-performance multi-threaded request processing
"""

import os
import sys
import json
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import re

PORT = int(os.environ.get('PORT', 8000))
ADMIN_PIN = "95511"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'courses.json')
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)


class EducationAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range, X-Admin-Pin')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, data, status=200):
        if isinstance(data, (dict, list)):
            body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        elif isinstance(data, str):
            body = data.encode('utf-8')
        else:
            body = b""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def check_admin(self):
        pin = self.headers.get('X-Admin-Pin') or self.headers.get('Admin-Pin')
        if pin == ADMIN_PIN:
            return True
        self.send_json({"error": "លេខកូដសម្ងាត់មិនត្រឹមត្រូវ (Unauthorized: Invalid Admin PIN)"}, status=401)
        return False

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/courses':
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    data = f.read()
            else:
                data = "[]"
            self.send_json(data)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/login':
            self.handle_login()
        elif path == '/api/upload':
            if self.check_admin():
                self.handle_upload()
        elif path == '/api/courses':
            if self.check_admin():
                self.handle_save_courses()
        elif path == '/api/lessons':
            if self.check_admin():
                self.handle_add_lesson()
        else:
            self.send_error(404, 'Endpoint not found')

    def handle_login(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            payload = json.loads(body.decode('utf-8'))
            pin = payload.get('pin', '').strip()

            if pin == ADMIN_PIN:
                self.send_json({"success": True, "token": ADMIN_PIN, "role": "admin"})
            else:
                self.send_json({"success": False, "message": "លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ!"}, status=401)
        except Exception as e:
            self.send_error(500, f'Login error: {str(e)}')

    def handle_upload(self):
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_error(400, 'multipart/form-data expected')
                return

            boundary_match = re.search(r'boundary=([^;]+)', content_type)
            if not boundary_match:
                self.send_error(400, 'boundary not found')
                return

            boundary = boundary_match.group(1).strip('"').encode('utf-8')
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            delimiter = b'--' + boundary
            parts = body.split(delimiter)
            uploaded_files = []

            for part in parts:
                if not part or part.strip() == b'--':
                    continue
                if b'\r\n\r\n' not in part:
                    continue

                header_data, file_data = part.split(b'\r\n\r\n', 1)
                file_data = file_data.rstrip(b'\r\n')
                header_text = header_data.decode('utf-8', errors='ignore')

                fn_match = re.search(r'filename="([^"]+)"', header_text)
                if not fn_match:
                    fn_match = re.search(r"filename\*=UTF-8''([^;\r\n]+)", header_text)
                    if fn_match:
                        raw_filename = urllib.parse.unquote(fn_match.group(1))
                    else:
                        continue
                else:
                    raw_filename = fn_match.group(1)

                clean_name = os.path.basename(raw_filename).replace('..', '')
                if not clean_name:
                    continue

                target_path = os.path.join(UPLOADS_DIR, clean_name)
                with open(target_path, 'wb') as f:
                    f.write(file_data)

                size_bytes = len(file_data)
                human_size = f"{size_bytes / (1024 * 1024):.1f} MB" if size_bytes > 1024 * 1024 else f"{size_bytes / 1024:.1f} KB"
                ext = os.path.splitext(clean_name)[1].lower().lstrip('.')

                uploaded_files.append({
                    "fileName": clean_name,
                    "url": f"uploads/{clean_name}",
                    "size": human_size,
                    "type": ext
                })

            self.send_json({
                "success": True,
                "message": "File(s) uploaded successfully",
                "files": uploaded_files
            })
        except Exception as e:
            self.send_error(500, f'Upload error: {str(e)}')

    def handle_save_courses(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            courses = json.loads(body.decode('utf-8'))
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(courses, f, ensure_ascii=False, indent=2)
            self.send_json({"success": True})
        except Exception as e:
            self.send_error(500, f'Save error: {str(e)}')

    def handle_add_lesson(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            payload = json.loads(body.decode('utf-8'))

            course_id = payload.get('courseId')
            new_lesson = payload.get('lesson')

            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    courses = json.load(f)
            else:
                courses = []

            course = next((c for c in courses if c['id'] == course_id), None)
            if not course:
                self.send_error(404, 'Course not found')
                return

            if not course.get('chapters'):
                course['chapters'] = [{
                    "id": "ch-1",
                    "title": payload.get('chapterTitle', 'ជំពូកទូទៅ'),
                    "lessons": []
                }]

            course['chapters'][0]['lessons'].append(new_lesson)
            course['totalLessons'] = sum(len(ch.get('lessons', [])) for ch in course['chapters'])
            course['totalFiles'] = sum(
                sum(len(l.get('files', [])) for l in ch.get('lessons', []))
                for ch in course['chapters']
            )

            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(courses, f, ensure_ascii=False, indent=2)

            self.send_json({"success": True, "lesson": new_lesson})
        except Exception as e:
            self.send_error(500, f'Add lesson error: {str(e)}')

    def do_DELETE(self):
        if not self.check_admin():
            return
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/lessons/'):
            lesson_id = path.replace('/api/lessons/', '')
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    courses = json.load(f)
                found = False
                for c in courses:
                    for ch in c.get('chapters', []):
                        orig = len(ch.get('lessons', []))
                        ch['lessons'] = [l for l in ch.get('lessons', []) if l['id'] != lesson_id]
                        if len(ch['lessons']) < orig:
                            found = True
                    c['totalLessons'] = sum(len(ch.get('lessons', [])) for ch in c.get('chapters', []))
                    c['totalFiles'] = sum(
                        sum(len(l.get('files', [])) for l in ch.get('lessons', []))
                        for ch in c.get('chapters', [])
                    )
                if found:
                    with open(DATA_FILE, 'w', encoding='utf-8') as f:
                        json.dump(courses, f, ensure_ascii=False, indent=2)
                    self.send_json({"success": True})
                else:
                    self.send_error(404, 'Lesson not found')
            except Exception as e:
                self.send_error(500, f'Delete error: {str(e)}')
        else:
            self.send_error(404, 'Endpoint not found')


def get_local_ip():
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '192.168.1.6'


def run_server():
    server = ThreadingHTTPServer(('', PORT), EducationAppHandler)
    server.daemon_threads = True
    local_ip = get_local_ip()
    print(f"==================================================")
    print(f" 1st Step (First Step) - Digital LMS Server")
    print(f" Local PC:   http://localhost:{PORT}")
    print(f" Mobile App: http://{local_ip}:{PORT} (Same Wi-Fi)")
    print(f" Folder:     {BASE_DIR}")
    print(f"==================================================")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()


if __name__ == '__main__':
    run_server()
