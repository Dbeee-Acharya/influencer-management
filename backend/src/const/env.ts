export const ENV_VARS = {
  server: {
    port: Number(process.env.PORT || "4000"),
    node_env: process.env.NODE_ENV || "development",
    frontend_origins: (process.env.FRONTEND_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  },
  database: {
    database_url: process.env.DATABASE_URL!,
  },
  auth: {
    jwt_secret: process.env.JWT_SECRET!,
  },
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
};
