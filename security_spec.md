# Security Specification — Social Proof

## 1. Data Invariants
1. Only the single designated campaign document `/campaigns/dasam-baby-venkatesh` and its `/members/{deviceId}` subcollection are accessible.
2. Each `deviceId` may join the community **at most once**: creating `/campaigns/dasam-baby-venkatesh/members/{deviceId}` is immutable (`update` and `delete` are denied) and can only happen if the member document does not already exist.
3. **Atomicity Guarantee (Pillar 7)**:
   - Incrementing `/campaigns/dasam-baby-venkatesh` (`supportersCount + 1`) MUST occur in the same atomic transaction as creating `/campaigns/dasam-baby-venkatesh/members/$(incoming().lastDeviceId)`.
   - Creating `/campaigns/dasam-baby-venkatesh/members/{deviceId}` MUST occur in the same atomic transaction as updating/creating `/campaigns/dasam-baby-venkatesh` with `lastDeviceId == deviceId`.
4. Collection `list` queries on both `/campaigns` and `/campaigns/{campaignId}/members` are strictly denied to prevent scraping.
5. Document `delete` operations on `/campaigns/{campaignId}` and `/campaigns/{campaignId}/members/{deviceId}` are strictly denied.
6. `title` and `createdAt` on the campaign document are immutable after creation.
7. All timestamps (`createdAt`, `updatedAt`, `joinedAt`) MUST equal server `request.time`.
8. No shadow fields are permitted on any create or update operation.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Duplicate Device Join**: Re-running an increment with a `lastDeviceId` whose `/members/{deviceId}` already exists.
2. **Uncoupled Counter Increment**: Updating `supportersCount + 1` without atomically creating `/members/{lastDeviceId}`.
3. **Uncoupled Member Creation**: Creating `/members/{deviceId}` without atomically incrementing `/campaigns/dasam-baby-venkatesh`.
4. **Shadow Field on Campaign Update**: `{ supportersCount: existing + 1, updatedAt: serverTimestamp(), lastDeviceId: "dev_abc12345", role: "admin" }`.
5. **Shadow Field on Member Create**: `{ deviceId: "dev_abc12345", joinedAt: serverTimestamp(), isVerified: true }`.
6. **Counter Inflation Attack**: `{ supportersCount: existing + 500, updatedAt: serverTimestamp(), lastDeviceId: "dev_abc12345" }`.
7. **Counter Decrement Attack**: `{ supportersCount: existing - 1, updatedAt: serverTimestamp(), lastDeviceId: "dev_abc12345" }`.
8. **Type Poisoning (String Counter)**: `{ supportersCount: "100", updatedAt: serverTimestamp(), lastDeviceId: "dev_abc12345" }`.
9. **Title or createdAt Tampering on Update**: Modifying `title` or `createdAt` during an increment.
10. **Client-Forged Timestamp**: Supplying client-side `Timestamp.fromMillis(1000)` instead of `serverTimestamp()`.
11. **Device ID Poisoning / Mismatch**: Creating `/members/dev_12345678` with payload `{ deviceId: "dev_other123" }` or a 1KB junk ID.
12. **Collection Scraping / Destructive Delete**: `getDocs(collection(db, "campaigns/dasam-baby-venkatesh/members"))` or `deleteDoc(...)`.
