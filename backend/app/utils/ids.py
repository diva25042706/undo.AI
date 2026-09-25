import random
import uuid


def generate_uuid() -> str:
    return str(uuid.uuid4())


def generate_action_id() -> str:
    """Generates an action identifier like ACT-92831"""
    num = random.randint(10000, 99999)
    return f"ACT-{num}"


def generate_checkpoint_id() -> str:
    """Generates a checkpoint identifier like CHK-41029"""
    num = random.randint(10000, 99999)
    return f"CHK-{num}"


def generate_snapshot_id() -> str:
    """Generates a snapshot identifier like SNP-1029"""
    num = random.randint(1000, 9999)
    return f"SNP-{num}"


def generate_audit_id() -> str:
    """Generates an audit identifier like AUD-9021"""
    num = random.randint(1000, 9999)
    return f"AUD-{num}"
