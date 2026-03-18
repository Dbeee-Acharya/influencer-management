export const ENV_VARS = {
  server: {
    port: Number(process.env.PORT || "4000"),
    node_env: process.env.NODE_ENV || "development",
    frontend_origins: (process.env.FRONTEND_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
  },
  database: {
    database_url: process.env.DATABASE_URL!,
  },
  auth: {
    jwt_secret: process.env.JWT_SECRET!,
  },
};
