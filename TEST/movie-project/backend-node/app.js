import express from "express";
import { ApolloServer } from "@apollo/server";
import mongoose from "mongoose";
import cors from "cors";
import typeDefs from "./graphql/typeDefs/index.js";
import resolvers from "./graphql/resolver/index.js";
import dotenv from "dotenv";
import * as loaders from "./graphql/loader/index.js";
dotenv.config();

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export { app, server };
