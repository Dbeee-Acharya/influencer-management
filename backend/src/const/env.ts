export const ENV_VARS = {
  server: {
    port: Number(process.env.PORT || "4000"),
    node_env: process.env.NODE_ENV || "development",
    frontend_origins: process.env.FRONTEND_ORIGINS!,
  },
  database: {
    database_url: process.env.DATABASE_URL!,
  },
};
