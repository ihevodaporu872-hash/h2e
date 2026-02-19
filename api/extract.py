"""Vercel serverless function for BOQ extraction."""

import json
import os
from http.server import BaseHTTPRequestHandler

import openai


class handler(BaseHTTPRequestHandler):
    """Handle BOQ extraction requests."""

    def do_POST(self):
        """Process document and extract BOQ items."""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}

            text = data.get('text', '')
            project_name = data.get('projectName', 'Untitled Project')

            if not text:
                self._send_error(400, 'No text provided')
                return

            # Check for API key
            api_key = os.environ.get('OPENAI_API_KEY')
            if not api_key:
                self._send_error(500, 'OpenAI API key not configured')
                return

            # Extract BOQ using OpenAI
            result = self._extract_boq(text, project_name, api_key)

            self._send_json(200, result)

        except json.JSONDecodeError:
            self._send_error(400, 'Invalid JSON')
        except Exception as e:
            self._send_error(500, str(e))

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _extract_boq(self, text: str, project_name: str, api_key: str) -> dict:
        """Extract BOQ items using OpenAI."""
        client = openai.OpenAI(api_key=api_key)

        system_prompt = """You are an expert construction estimator and quantity surveyor.
Extract Bill of Quantities (BOQ) items from the provided tender document text.

For each work item found, extract:
- itemNumber: The item reference number
- description: Full description of the work item
- unit: Unit of measurement (м², м³, шт, т, м.п., комплект, etc.)
- quantity: Numerical quantity (null if not specified)
- rate: Unit rate/price (null if not specified)
- amount: Total amount (null if not specified)
- section: The work section (e.g., "Земляные работы", "Бетонные работы", etc.)
- confidence: Your confidence in this extraction (0.0 to 1.0)

Return JSON format only."""

        user_prompt = f"""Extract BOQ items from this tender document:

---
{text[:8000]}
---

Respond with JSON:
{{
    "items": [
        {{
            "itemNumber": "1.1",
            "description": "Описание работы",
            "unit": "м³",
            "quantity": 100,
            "rate": 5000,
            "amount": 500000,
            "section": "Название раздела",
            "confidence": 0.95
        }}
    ],
    "sections": [
        {{"name": "Название раздела", "count": 1, "subtotal": 500000}}
    ],
    "totalItems": 1,
    "grandTotal": 500000
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        # Add processing metadata
        result['projectName'] = project_name
        result['processingTime'] = 0  # Will be calculated on frontend

        return result

    def _send_json(self, status: int, data: dict):
        """Send JSON response."""
        self.send_response(status)
        self._set_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, status: int, message: str):
        """Send error response."""
        self._send_json(status, {'error': message})

    def _set_cors_headers(self):
        """Set CORS headers for cross-origin requests."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
