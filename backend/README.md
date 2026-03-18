```
npm install
npm run dev
```

```
open http://localhost:3000
```

seed admin
```bash
npx tsx src/scripts/seed-admin.ts admin@example.com yourpassword
```
```bash
npx tsx src/scripts/seed-staff.ts editor alice@example.com password123
```
```bash
npx tsx src/scripts/seed-staff.ts viewer bob@example.com password123
```


migrate csv
```bash
npx tsx src/scripts/init-migrate.ts
```
