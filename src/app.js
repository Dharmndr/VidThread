import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; 

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) 
app.use(express.urlencoded({extended:true, limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser()); // parses cookie(string to object)

// routes import 
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"


//routes declaration --> app.use means it is used as middleware
app.use("/api/v1/users",userRouter);                  // looks like http://localhost:8000/api/v1/users/register(or login)
app.use("/api/v1/videos",videoRouter);
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/subscriptions",subscriptionRouter); 
app.use("/api/v1/playlists",playlistRouter);
app.use("/api/v1/dashboards",dashboardRouter);
app.use("/api/v1/healthchecks",healthcheckRouter);




// Custom Error handler middleware -> formats all error as JSON from express html error page FOR the client(postman,frontend etc.)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

export {app}
  