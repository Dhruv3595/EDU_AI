"""
Logging Utility
"""

import logging
import sys
import os
from datetime import datetime

# Create logs directory if it doesn't exist
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'{log_dir}/app_{datetime.now().strftime("%Y%m%d")}.log')
    ]
)

logger = logging.getLogger("EduAI")