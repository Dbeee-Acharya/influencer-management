module.exports = {
  apps: [
    {
      name: "influencer-api",
      script: "./dist/index.js",
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "600M",

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      restart_delay: 2000,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Logging
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Environment
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
