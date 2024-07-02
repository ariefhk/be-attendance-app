// import { logger } from "@/application/logging.js";
// import { web } from "@/application/web.js";
import { logger } from "./application/logging.js";
import { web } from "./application/web.js";
import cluster from "cluster";
import { cpus } from "os";
import process from "process";
const PORT = process.env.PORT ?? 5000;

if (cluster.isPrimary) {
  // Fork workers for each CPU core
  const numCPUs = cpus().length;
  // logger.info(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    // logger.info(`Worker ${worker.process.pid} died`);
    // Ensure a new worker replaces the dead one
    cluster.fork();
  });
} else {
  // Workers share the same port, but use separate Express instances
  web.listen(PORT, () => {
    logger.info(`NodeJs worker-${process.pid} started. Listening on port ${PORT}`);
  });
}
