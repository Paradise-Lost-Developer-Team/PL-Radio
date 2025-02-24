module.exports = {
  apps: [
    {
        name: 'pl-radio',
        script: 'build/js/index.js',
        watch: true,
        autorestart: true,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development',
        },
    },
  ],
};