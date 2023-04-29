const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let db = null;

const initializeDbAndSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndSever();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `select * from todo where 
          todo like '%${search_q}%'
          and status = '${status}' and priority = '${priority}';`;

      break;

    case hasStatusProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%'
            and status = '${status}';`;

      break;

    case hasPriorityProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' 
            and priority = '${priority}';`;
      break;

    default:
      getTodoQuery = `select * from todo 
          where todo like '%${search_q}%';`;
      break;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `select * from todo 
    where id = ${todoId};`;

  const queryData = await db.get(query);
  response.send(queryData);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const query = `INSERT INTO todo(id,todo,priority,status) VALUES(${id},'${todo}','${priority}','${status}');`;
  //console.log(query);
  const queryData = await db.run(query);
  //console.log(queryData);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { status, priority, todo } = request.body;
  const { todoId } = request.params;
  let updateField = "";
  let updateQuery = "";
  let responseMessage = "";

  switch (true) {
    case status !== undefined:
      updateQuery = `update todo set status = '${status}' 
          where id = ${todoId};`;
      responseMessage = "Status Updated";
      break;
    case priority !== undefined:
      updateQuery = `update todo set priority = '${priority}' 
          where id = ${todoId};`;
      responseMessage = "Priority Updated";
      break;

    case todo !== undefined:
      updateQuery = `update todo set todo = '${todo}' 
          where id = ${todoId};`;
      responseMessage = "Todo Updated";

      break;

    default:
      break;
  }

  let queryData = await db.run(updateQuery);
  response.send(responseMessage);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const query = `delete from todo
    where id = ${todoId};`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
