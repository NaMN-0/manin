import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(log_filename: str = "app.log", log_dir: str = "logs"):
    """
    Configures a rotating file logger for the application.
    Writes to logs/app.log by default.
    """
    os.makedirs(log_dir, exist_ok=True)
    log_filepath = os.path.join(log_dir, log_filename)
    
    root_logger = logging.getLogger()
    # Set level to INFO by default, can be overridden by env vars
    root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

    # Prevent adding handlers multiple times
    if not any(isinstance(h, RotatingFileHandler) and h.baseFilename == os.path.abspath(log_filepath) for h in root_logger.handlers):
        max_bytes = 10 * 1024 * 1024  # 10 MB
        backup_count = 5
        
        file_handler = RotatingFileHandler(log_filepath, maxBytes=max_bytes, backupCount=backup_count)
        console_handler = logging.StreamHandler()

        formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(filename)s:%(lineno)s] %(message)s")
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)
        
        logging.info(f"Logging initialized. Writing to {log_filepath}")
