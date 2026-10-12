# Amazon Developer Hackathon 2026 - Resources & References

This document records all official resources, API guides, and repositories referenced in the design and implementation of KindDoor.

---

## 1. Official Resources & References Consulted

### 1.1. Ring Track
- **Official Starter Repository**: [https://github.com/AmazonAppDev/ring-api-helloworld](https://github.com/AmazonAppDev/ring-api-helloworld)
  - Reused patterns: Webhook signature verification (`HMAC-SHA256`), event timestamp normalization, idempotency token validation.
- **Ring Developer Portal**: [https://developer.ring.com/](https://developer.ring.com/)
- **Amazon Ring API Documentation**: [https://developer.amazon.com/docs/ring/api-documentation.html](https://developer.amazon.com/docs/ring/api-documentation.html)
- **Ring Development Guide**: [https://developer.amazon.com/docs/ring/develop.html](https://developer.amazon.com/docs/ring/develop.html)
- **Ring UX Design Guide**: [https://developer.amazon.com/docs/ring/ux-design-guide.html](https://developer.amazon.com/docs/ring/ux-design-guide.html)

### 1.2. Alexa+ Track & Model Context Protocol (MCP)
- **Hackathon Resources & FAQs**: [https://amazonappdev2026.devpost.com/resources](https://amazonappdev2026.devpost.com/resources)
- **Official Hackathon Rules**: [https://amazonappdev2026.devpost.com/rules](https://amazonappdev2026.devpost.com/rules)
- **MCP Quickstart Guide**: [https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html)
- **MCP Client Lifecycle Specification**: [https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-client-lifecycle.html](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-client-lifecycle.html)
- **Official Model Context Protocol SDK**: `@modelcontextprotocol/sdk` (Version 2025-11-25 / 2024-11-05 Streamable HTTP specification).

### 1.3. AWS Builder Track & Amazon Bedrock
- **Amazon Bedrock Getting Started**: [https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html](https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html)
- **Bedrock Converse API & Tool Use**: [https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html)
  - Applied `@aws-sdk/client-bedrock-runtime` for tool specification compilation and conversational loop execution.
- **Amazon Devices Builder Tools**: [https://developer.amazon.com/docs/adbt/get-started](https://developer.amazon.com/docs/adbt/get-started)

---

## 2. Implemented Capabilities vs Scope Boundaries

| Capability | Real Integration | Simulated Adapter | Future Alexa+ Production Dependency |
| :--- | :---: | :---: | :--- |
| **Streamable HTTP MCP Server** | YES | - | Ready for Alexa+ add-on manifest registration |
| **Live MCP Web Client** | YES | - | Connects directly to `/mcp` Streamable HTTP |
| **Ring Webhook Pipeline** | YES | - | Works with live Ring Developer endpoints |
| **Ring Device Events** | YES (when configured) | YES | Fallback simulator matches exact payload shape |
| **Bedrock Converse AI** | YES (when configured) | YES (deterministic) | AWS IAM credentials via environment variables |
| **Smart Door Lock** | - | YES (clearly labeled) | Production requires Matter / Z-Wave Smart Lock bridge |
| **Proximity BLE Beacon** | - | YES (cryptographic signal) | Production utilizes Apple HomeKit / Android Fast Pair UWB |
