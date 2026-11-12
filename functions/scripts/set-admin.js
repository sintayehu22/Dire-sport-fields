import { getAuth } from "firebase-admin/auth";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";

const uid = process.argv[2];
const shouldRevoke = process.argv.includes("--revoke");
if (!uid) {
  console.error("Usage: node functions/scripts/set-admin.js <firebase-auth-uid> [--revoke]");
  process.exitCode = 1;
} else {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: applicationDefault() });
  const auth = getAuth(app);
  const user = await auth.getUser(uid);
  const nextClaims = { ...user.customClaims };
  if (shouldRevoke) {
    delete nextClaims.admin;
  } else {
    nextClaims.admin = true;
  }
  await auth.setCustomUserClaims(uid, nextClaims);
  console.log(
    `${shouldRevoke ? "Revoked" : "Granted"} admin access ${shouldRevoke ? "from" : "to"} ${uid}. Ask the user to sign out and back in.`,
  );
}
