import express from "express";

/** The Express application instance. */
const app = express();

/** The port number for the server. */
const PORT = process.env.PORT || 3001;

// Parse JSON bodies.
app.use(express.json());

// Parse URL-encoded bodies.
app.use(express.urlencoded({ extended: true }));

// Error handling middleware.
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// 404 handler.
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found!" });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}.`);
});
