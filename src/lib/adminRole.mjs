/**
 * The server-managed Firestore record used for administrator authorization.
 * The document must live at users/{firebaseAuthUid}.
 */
export function isActiveAdminRecord(record) {
  return (
    record !== null &&
    typeof record === "object" &&
    record.role === "admin" &&
    record.status === "active"
  );
}
