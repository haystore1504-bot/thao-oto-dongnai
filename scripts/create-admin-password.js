const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.log("Cách dùng: node scripts/create-admin-password.js MAT_KHAU_CUA_BAN");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nDán dòng dưới đây vào file .env:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
