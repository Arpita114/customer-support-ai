import logging
import sys
from app.config import ENVIRONMENT


def setup_logger(name: str = "customer-support-ai") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO if ENVIRONMENT == "production" else logging.DEBUG)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(handler)

    return logger


logger = setup_logger()
