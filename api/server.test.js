// Write your tests here
test("sanity", () => {
  expect(true).toBe(true);
});

const request = require("supertest");
const User = require("./auth/auth-model");
const db = require("../data/dbConfig");
const server = require("./server");

const saorse = { username: "saorse", password: "1234" };
const siobhán = { username: "siobhán", password: "1234" };

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db("users").truncate();
});
afterAll(async () => {
  await db.destroy();
});

describe("[POST] on /register", () => {
  test("Adds user to db", async () => {
    let all;
    await User.insert(saorse);
    all = await db("users");
    expect(all).toHaveLength(1);

    await User.insert(siobhán);
    all = await db("users");
    expect(all).toHaveLength(2);
  });

  test("Resolves to added user", async () => {
    const user = await User.insert(saorse);
    expect(user[0]).toMatchObject(saorse);
  });
});

describe("[POST] on /login", () => {
  test("Returns token if login is successful", async () => {
    let result;

    const user = await request(server).post("/api/auth/register").send(siobhán);
    expect(user.body[0].username).toEqual(siobhán.username);
    result = await request(server).post("/api/auth/login").send(siobhán);
    expect(result.body.token).toBeDefined();
  });

  test("Returns error message if password is incorrect", async () => {
    let noPasswordLogin = {...siobhán};
    delete noPasswordLogin.password;

    await request(server).post("/api/auth/register").send(siobhán);
    const result = await request(server).post("/api/auth/login").send(noPasswordLogin);
    expect(result.body).toEqual({ message: "username and password required" });
  });
});

describe("[GET] on /jokes", () => {
  test("Returns jokes if token exists", async () => {
    let login;
    
    await request(server).post("/api/auth/register").send(siobhán);
    login = await request(server).post("/api/auth/login").send(siobhán);
    const token = login.body.token;

    const result = await request(server).get("/api/jokes").set({ Authorization: token });
    expect(result.body).toHaveLength(3);
  });

  test("Returns error if token doesn't exist", async () => {
    const result = await request(server).get("/api/jokes");
    expect(result.body).toEqual({ message: "token required"});
  });
});
