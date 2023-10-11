const nextConfig = {
  async headers() {
    return [
      { key: "Access-Control-Allow-Credentials", value: "true" },
      {
        key: "Access-Control-Allow-Origin",
        value: "http://localhost:5000",
      },
      // ...
    ];
  },
};
