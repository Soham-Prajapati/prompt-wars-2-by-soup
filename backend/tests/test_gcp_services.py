import pytest
from unittest.mock import MagicMock, patch
from app.services.gcp_service import gcp_service
from app.services.analytics_service import analytics_service
from app.services.pubsub_service import pubsub_service
from app.services.storage_service import storage_service

@pytest.fixture
def mock_gcp_clients():
    with patch("google.cloud.secretmanager.SecretManagerServiceClient"), \
         patch("google.cloud.bigquery.Client"), \
         patch("google.cloud.vision.ImageAnnotatorClient"), \
         patch("google.cloud.pubsub_v1.PublisherClient"), \
         patch("google.cloud.storage.Client"):
        yield

def test_secret_service_lookup(mock_gcp_clients):
    # Mock the secret manager response
    gcp_service.secret_client.access_secret_version = MagicMock()
    mock_resp = MagicMock()
    mock_resp.payload.data.decode.return_value = "mock-key"
    gcp_service.secret_client.access_secret_version.return_value = mock_resp
    
    key = gcp_service.get_secret("TEST_KEY")
    assert key == "mock-key"

def test_analytics_write(mock_gcp_clients):
    analytics_service.client.insert_rows_json = MagicMock(return_value=[])
    analytics_service.write_event("test_event", "sess-123", "/test", {"foo": "bar"})
    assert analytics_service.client.insert_rows_json.called

def test_pubsub_publish(mock_gcp_clients):
    pubsub_service.publisher.publish = MagicMock()
    pubsub_service.publish_event("test_pub", {"data": "test"})
    assert pubsub_service.publisher.publish.called

def test_storage_upload(mock_gcp_clients):
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    storage_service.client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    
    url = storage_service.upload_file(b"test content", "test.jpg")
    assert mock_blob.upload_from_string.called
    assert "test.jpg" in url
