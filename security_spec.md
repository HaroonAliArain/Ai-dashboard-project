# Firebase Security Specification - Nexus AI Dashboard

## Data Invariants
1. A Task or Thread must belong to a valid authenticated user.
2. Users can only read and write their own profile and associated data.
3. Message roles are restricted to 'user' and 'model'.
4. Timestamps must be server-validated.
5. IDs must be correctly formatted.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create a user profile with a `userId` that doesn't match `request.auth.uid`.
2. **Cross-User Leak**: Attempt to read another user's threads: `/users/target-uid/threads/thread-123`.
3. **Ghost Field Injection**: Attempt to create a thread with an extra field `isAdmin: true`.
4. **Invalid Role**: Attempt to create a message with `role: 'admin'`.
5. **Timestamp Poisoning**: Attempt to send a manual string `2020-01-01` for `createdAt` instead of `request.time`.
6. **Orphaned Message**: Attempt to create a message without a valid parent thread existence check (using `get` check in rules).
7. **Resource Poisoning**: Use a 2MB string for the `content` field.
8. **Path ID Injection**: Use a 10KB junk string as a `threadId` in the URL.
9. **State Shortcutting**: Attempt to update `createdAt` of an existing document.
10. **Shadow Profile Update**: Attempt to update another user's `email` field.
11. **PII Blanket Read**: Attempt to list all users without being the owner of the profiles.
12. **Recursive Cost Attack**: Making deep nested queries without proper relational filtering in rules.

## Test Runner
Wait for implementation of `firestore.rules.test.ts`.
