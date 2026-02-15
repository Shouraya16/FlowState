class FeatureRequest:
    def __init__(self, request_id, description, client):
        self.request_id = request_id
        self.description = description
        self.client = client
        self.status = "PENDING_APPROVAL"

    def create_request(self):
        print(f"Feature Request '{self.description}' created by {self.client}")
        return self.status
    
    def update_status(self, new_status):
        self.status = new_status
        print(f"Request status updated to {self.status}")

    def get_request_details(self):
        return {
            "Request ID": self.request_id,
            "Description": self.description,
            "Client": self.client,
            "Status": self.status
        }