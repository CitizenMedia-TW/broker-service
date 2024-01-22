const mongoose = require("mongoose");
const request = require("supertest");

const express = require('express');
const cors = require('cors');
require('module-alias/register') // Required for module aliasing
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

require("dotenv").config();

import {authRoute, userRoute, storyRoute } from "../src/routes";
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/story', storyRoute);

/* Connecting to the database before all tests. */
beforeAll(async () => {
    require('../src/database');
    require('../src/constants');
});

/* Closing database connection after all tests. */
afterAll(async () => {
    await mongoose.connection.close();
});

//default
describe("1 + 1 = 2", () => {
    it("default", async () => {
        expect(1 + 1).toBe(2);
    });
});

//Register
describe("Register", () => {
    it("TEST: POST /auth/register", async () => {
        const res = await request(app).post("/auth/register").send({
            username: "test",
            email: "test@gmail.com",
            password: "test"
        });
        expect(res.statusCode).toBe(401);
    });
});

//Log In
let token: string;
describe("Log In", () => {
    it("TEST: POST /auth/credentials", async () => {
        const res = await request(app).post("/auth/credentials").send({
            email: "test@gmail.com",
            password: "test"
        });
        expect(res.statusCode).toBe(200);
        token = res.body.jwtToken;
    });
});

//user route
describe("Test userRoute", () => {
    it("TEST: GET /user/public-profile/:id", async () => {
        const res = await request(app).get(
            "/user/public-profile/65ae229b49890db07809b63a"
        );
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe("test");
        expect(res.body.email).toBe("test@gmail.com");
    });

    it("TEST: GET /user/public-profile/:id", async () => {
        const res = await request(app).get(
            "/user/public-profile/65ae229b49890db07809b63b"
        );
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("User not found");
    });

    it("TEST: GET /user/profile-links", async () => {
        const res = await request(app)
            .get("/user/profile-links")
            .set("Authorization", 'Bearer' + token);
        expect(res.statusCode).toBe(200);
    });

    it("TEST: POST /user/profile-links", async () => {
        const res = await request(app)
            .post("/user/profile-links")
            .set("Authorization", 'Bearer' + token)
            .send({
                facebook: "https://facebook.com/test"
            })
        expect(res.statusCode).toBe(200);
    });
});

//story route
describe("Test storyRoute", () => {
    it("TEST: POST /story/retrieve-by-id", async () => {
        const res = await request(app).post("/story/retrieve-by-id").send({_id: "65ae243549890db07809b64d"});
        expect(res.statusCode).toBe(400);
    });

    it("TEST: POST /story/retrieve-by-id", async () => {
        const res = await request(app).post("/story/retrieve-by-id").send({_id: "65ae243549890db07809b64e"});
        expect(res.statusCode).toBe(200);
        expect(res.body.author).toBe("test");
        expect(res.body.title).toBe("title-test");
    });

    it("TEST: GET /story/retrieve", async () => {
        const res = await request(app)
            .get("/story/retrieve")
            .set("Authorization", 'Bearer' + token);
        expect(res.statusCode).toBe(200);
    });

    it("TEST: POST /story/like", async () => {
        const res = await request(app)
            .post("/story/like")
            .set("Authorization", 'Bearer' + token)
            .send({
                storyId: "65ae243549890db07809b64e",
                userId: "65ae229b49890db07809b63b"
            });
        expect(res.statusCode).toBe(200);
    });

    it("TEST: POST /story/create", async () => {
        const res = await request(app)
            .post("/story/create")
            .set("Authorization", 'Bearer' + token)
            .send({
                id: "65ae229b49890db07809b63b",
                content: "Test_content",
                title: "Test_title",
                subTitle: "Test_subtitle",
                tags: ["Test_tag_1", "Test_tag_2"]
            });
        expect(res.statusCode).toBe(200);
    });

    it("TEST: POST /story/comment", async () => {
        const res = await request(app)
            .post("/story/comment")
            .set("Authorization", 'Bearer' + token)
            .send({
                id: "65ae243549890db07809b64e",
                comment: "test",
                commenter_id: "65ae229b49890db07809b63b"
            });
        expect(res.statusCode).toBe(200);
    });

    it("TEST: GET /story/retrieve-eight", async () => {
        const res = await request(app).get(
            "/story/retrieve-eight"
        );
        expect(res.statusCode).toBe(200);
        const res_length = res.body.length;
        expect(res_length).toBeGreaterThanOrEqual(0);
        expect(res_length).toBeLessThanOrEqual(8);
    });
});
