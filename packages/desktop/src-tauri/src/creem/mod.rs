use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

pub struct CreemClient {
    api_url: String,
    api_key: String,
    client: Client,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckoutResponse {
    pub id: String,
    #[serde(rename = "checkout_url")]
    pub checkout_url: String,
}

impl CreemClient {
    pub fn new(api_url: &str, api_key: &str) -> Self {
        Self {
            api_url: api_url.to_string(),
            api_key: api_key.to_string(),
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .connect_timeout(Duration::from_secs(10))
                .build()
                .unwrap_or_else(|_| Client::new()),
        }
    }

    pub async fn create_checkout(
        &self,
        product_id: &str,
        success_url: &str,
    ) -> Result<String, String> {
        let url = format!("{}/v1/checkouts", self.api_url);

        let body = serde_json::json!({
            "product_id": product_id,
            "success_url": success_url
        });

        // 重试机制：最多重试 3 次
        let mut last_error = String::new();
        for attempt in 1..=3 {
            println!("Creem API attempt {} of 3", attempt);

            let response = self.client
                .post(&url)
                .header("x-api-key", &self.api_key)
                .header("Content-Type", "application/json")
                .json(&body)
                .send()
                .await;

            match response {
                Ok(resp) => {
                    let status = resp.status();
                    let text = resp.text().await.unwrap_or_default();

                    println!("Creem response status: {}, body: {}", status, text);

                    if status.is_success() {
                        match serde_json::from_str::<CheckoutResponse>(&text) {
                            Ok(data) => return Ok(data.checkout_url),
                            Err(e) => {
                                last_error = format!("Failed to parse response: {}", e);
                                if attempt < 3 {
                                    tokio::time::sleep(Duration::from_millis(500)).await;
                                    continue;
                                }
                            }
                        }
                    } else {
                        last_error = format!("Creem API error ({}): {}", status, text);
                        if attempt < 3 {
                            tokio::time::sleep(Duration::from_millis(500)).await;
                            continue;
                        }
                    }
                }
                Err(e) => {
                    last_error = format!("Request failed: {}", e);
                    println!("Creem request error: {}", e);
                    if attempt < 3 {
                        tokio::time::sleep(Duration::from_millis(500)).await;
                        continue;
                    }
                }
            }
        }

        Err(last_error)
    }
}

pub fn get_creem_client() -> Result<CreemClient, String> {
    let is_test_mode = true;

    let api_url = if is_test_mode {
        "https://test-api.creem.io"
    } else {
        "https://api.creem.io"
    };

    let api_key = "creem_test_410zEzOWB01XB1lakg2lY8";

    Ok(CreemClient::new(api_url, api_key))
}
