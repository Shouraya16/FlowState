# data_management.py

class DatabaseContext:
    def __init__(self):
        self.connection = "Connected to AWS RDS"

    def get_feature_request(self, req_id):
        # Simulated DB fetch
        print(f"[DB] Fetching Feature Request {req_id}")
        return {"req_id": req_id, "title": "Add Dark Mode", "status": "PENDING"}

    def update_request_status(self, req_id, new_status):
        # Simulated DB update
        print(f"[DB] Updating Request {req_id} to status: {new_status}")
        return True

    def insert_new_task(self, title, priority, status):
        # Simulated DB insert
        new_task_id = 101 # auto-generated ID
        print(f"[DB] Inserted new Task '{title}' with ID: {new_task_id}")
        return new_task_id