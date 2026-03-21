#!/usr/bin/env python
"""
Run the Flask API server for Football Analysis
"""

import os
from api.app import create_app

if __name__ == '__main__':
    config_name = os.getenv('FLASK_ENV', 'development')
    app = create_app(config_name)
    
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', 5000))
    
    print(f"[v0] Starting Football Analysis API on {host}:{port}")
    print(f"[v0] Environment: {config_name}")
    print(f"[v0] API available at http://localhost:{port}")
    
    app.run(host=host, port=port, debug=(config_name == 'development'))
