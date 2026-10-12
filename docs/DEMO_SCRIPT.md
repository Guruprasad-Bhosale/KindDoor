# KindDoor Hackathon Live Demonstration Script

This script walks judges, evaluators, and engineers through each feature of KindDoor step-by-step, highlighting real integrations, safety mechanisms, and accessibility accommodations.

---

## Preparation & Starting the Application
1. Start the backend server: `pnpm --filter @kinddoor/server dev` (Runs on `http://localhost:4000`)
2. Start the web frontend: `pnpm --filter @kinddoor/web dev` (Runs on `http://localhost:3000`)
3. Open `http://localhost:3000` in Google Chrome or Microsoft Edge (to enable Web Speech API).

---

## Part 1: Hands-Free Resident Arrival (Scenario A)

### Step 1.1: Successful Entry
1. Navigate to the **Scenario Simulator** tab.
2. Under Scenario A, ensure "Authorized BLE Credential" is checked and Resident is set to "Eleanor (Resident)".
3. Click **"Trigger Hands-Free Arrival"**.
4. **Observe:**
   - The simulated lock indicator updates: `LOCKED` -> `UNLOCKING` -> `UNLOCKED`.
   - Audio feedback speaks: *"Welcome home Eleanor. The front door is unlocked."*
   - Live Developer Inspector on the right shows the real MCP tool calls:
     1. `get_resident_preferences`
     2. `evaluate_entry_authorization` (returns `authorized: true, lockCommandToken`)
     3. `execute_authorized_entry`
     4. `get_lock_status`

### Step 1.2: Negative Security Test (Invalid Credential)
1. In the Scenario A card, uncheck "Authorized BLE Credential" (or select "Spoofed / Invalid Token").
2. Click **"Trigger Hands-Free Arrival"**.
3. **Observe:**
   - The door remains firmly `LOCKED`.
   - Clear audio & visual explanation: *"Credential verification failed. Door remains locked for safety."*
   - Policy engine log shows `REASON: INVALID_CREDENTIAL_TOKEN`.

---

## Part 2: Blind / Low-Vision Resident Experience (Scenario B)

1. Navigate to **Accessibility Settings** or use the top profile switcher to set Eleanor's mode to **"Blind / Low-Vision (Voice-First)"**.
2. Navigate to **Scenario Simulator** -> Scenario B ("Neighbor Maya Arrival").
3. Click **"Trigger Doorbell Ring"**.
4. **Observe:**
   - Screen reader announcement triggers automatically.
   - The browser synthesizes spoken speech:
     *"Someone is at your front door. It appears to be your neighbor Maya. She says she brought the gardening tools you borrowed. Press Space to hear again, or press 1 to speak, 2 to decline."*
   - Press the **Spacebar** keyboard shortcut to verify instant audio repetition.
   - Press **`1`** on the keyboard to open two-way audio.

---

## Part 3: Deaf / Hard-of-Hearing Resident Experience (Scenario C)

1. Switch active profile mode to **"Deaf / Hard-of-Hearing (Visual-First)"**.
2. Trigger Scenario C ("Amazon Delivery Courier").
3. **Observe:**
   - Prominent flashing amber visual border and alert banner.
   - Live visual transcript card appears with high-contrast text:
     - **Status**: Temporary Delivery Visit
     - **Courier Statement**: *"Package delivery for Eleanor — needs signature or leave on porch."*
   - Accessible action buttons (`[Leave on Porch]`, `[Admit]`, `[Decline]`).
   - Zero audio requirement; all interaction is 100% visual and keyboard navigable.

---

## Part 4: Older Resident Needs Patient Assistance (Scenario D)

1. Switch active mode to **"Patient / Simplified Interaction"**.
2. Trigger Scenario D ("Visitor Mark").
3. In the live conversation bar, type or simulate: *"Who is at the door?"*
4. KindDoor responds with simplified, calm dialogue:
   *"Someone who appears to be Mark is here. He says he has come to visit you. Would you like to speak to him?"*
5. Simulate confusion: *"I don't understand."*
6. KindDoor reduces complexity into two crystal-clear choice buttons:
   - **Option A**: *"Yes, let me speak with Mark"*
   - **Option B**: *"No, I'd rather not right now"*
7. Observe that if neither option is clicked, the door remains strictly locked.

---

## Part 5: Unfamiliar Visitor & Consent-Gated Enrollment (Scenario E)

1. Trigger Scenario E ("Unknown Visitor: John").
2. Visitor states: *"I'm John. I'm a family friend."*
3. **Observe:**
   - KindDoor marks identity as `UNVERIFIED_CLAIM` (Distinguishing stated name from verified profile).
   - MCP tool `record_visit_purpose` creates a temporary visit record with an auto-purge deadline.
   - KindDoor notifies resident: *"A visitor at the door claims to be John, a family friend. We do not have a verified profile for John. Would you like to enroll John?"*
   - An explicit consent toggle **"I authorize saving John as an enrolled regular visitor"** must be checked before the `enroll_regular_visitor` tool can be triggered.

---

## Part 6: Developer Inspector & Technical Audit

1. Inspect the **Developer Inspector** pane.
2. Verify:
   - **MCP Connection**: Streamable HTTP `connected` (Protocol version 2025-11-25).
   - **Discovered Tools**: 10 active tools listed.
   - **Tool Call History**: Timestamped latency, input JSON, output JSON.
   - **Ring Ingestion**: HMAC verification status (`PASS`) and deduplication cache hits.
   - **Bedrock / Fallback Status**: Live indicator showing Bedrock Converse runtime or Deterministic Fallback.
