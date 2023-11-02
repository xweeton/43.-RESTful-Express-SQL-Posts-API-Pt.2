let express = require('express'); // import express
let path = require('path'); // import path
const cors = require('cors'); //ensuring that only authorized and trusted applications can access
const { Pool } = require('pg'); //perform a query on a PostgreSQL database
require('dotenv').config(); //import 'secrets'


let app = express() // create express app
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query('SELECT version()');
    console.log(response.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

// ----------------------app---------------------------------


// create new post
app.post('/posts', async (req, res) => {
  const client = await pool.connect();
  try {
    const data = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      created_at: new Date().toISOString()
    };

    const query = 'INSERT INTO posts (title, content, author, created_at) VALUES ($1, $2, $3, $4) RETURNING id';
    const params = [data.title, data.content, data.author, data.created_at];

    const result = await client.query(query, params);
    data.id = result.rows[0].id; //assign the last inserted id to data object

    console.log(`Post created successfully with id ${data.id}`);
    res.json({ "status": "success", "data": data, "message": "Post created successfully" });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ "error": error.message });
  } finally {
    client.release();
  }
})


// get all
app.get('/posts', async (req, res) => {
  // Database client
  const client = await pool.connect();

  try {
    // SQL query to get all posts
    const query = 'SELECT * FROM posts'
    //running the query
    const result = await client.query(query);
    //send the result to client frontend
    res.json(result.rows)

  } catch (err) {
    console.log(err.stack);
    res.status(500).send('An error occurred');
  } finally {
    // release client connection, to save memory
    client.release();
  }
});


// get with selected id
app.get('/posts/:id', async (req, res) => {
  // Database client
  const client = await pool.connect();
  const id = req.params.id;

  try {
    // SQL query to get all posts
    const selectQuery = 'SELECT * FROM posts WHERE id = $1'
    //running the query
    const result = await client.query(selectQuery, [id]);
    //send the result to client frontend
    res.json(result.rows)

  } catch (err) {
    console.log(err.stack);
    res.status(500).send('An error occurred');
  } finally {
    // release client connection, to save memory
    client.release();
  }
});


// get with selected authorName
app.get('/posts/author/:authorName', async (req, res) => {
  const client = await pool.connect();
  const authorName = req.params.authorName;

  try {
    const selectAuthorQuery = 'SELECT * FROM posts WHERE author = $1'
    const result = await client.query(selectAuthorQuery, [authorName]);
    res.json(result.rows)

  } catch (err) {
    console.log(err.stack);
    res.status(500).send('An error occurred')
  } finally {
    client.release();
  }
});


// get with selected data range
app.get('/posts/dates/:startDate/:endDate', async (req, res) => {
  const client = await pool.connect();
  const startDate = req.params.startDate;
  const endDate = req.params.endDate;

  try {
    const selectDateQuery = 'SELECT * FROM posts WHERE created_at BETWEEN $1 AND $2'
    const result = await client.query(selectDateQuery, [startDate, endDate]);
    res.json(result.rows)

  } catch (err) {
    console.log(err.stack);
    res.status(500).send('An error occurred')
  } finally {
    client.release();
  }
});


// update selected post by id
app.put('/posts/:id', async (req, res) => {
  const id = req.params.id
  const updatedData = req.body
  const client = await pool.connect()
  try {
    const updateQuery = 'UPDATE posts SET title = $1, content = $2, author = $3 WHERE id = $4'
    const queryData = [updatedData.title, updatedData.content, updatedData.author, id]
    await client.query(updateQuery, queryData)

    res.json({ "status": "success", "message": "Post updated successfully" })
  } catch (error) {
    console.error("Error:", error.message)
    res.status(500).json({ "error": error.message })
  } finally {
    client.release()
  }
})


// delete selected post by id
app.delete('/posts/:id', async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    const deleteQuery = 'DELETE FROM posts WHERE id = $1';
    await client.query(deleteQuery, [id]);

    res.json({ "status": "success", "message": `Post ${id} deleted successfully` });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ "error": error.message });

  } finally {
    client.release();
  }
})


// delete selected post by author
app.delete('/posts/author/:authorName', async (req, res) => {
  const authorName = req.params.authorName;
  const client = await pool.connect();

  try {
    const deleteQuery = 'DELETE FROM posts WHERE author = $1';
    await client.query(deleteQuery, [authorName]);

    res.json({ "status": "success", "message": `Post ${authorName} deleted successfully` });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ "error": error.message });

  } finally {
    client.release();
  }
})


// app.delete('/posts/:id', async (req, res) => {
//   const client = await pool.connect();
//   const postId = req.params.id;

//   try {
//     const query = 'DELETE FROM posts WHERE id = $1 RETURNING *';
//     const params = [postId];

//     const result = await client.query(query, params);

//     if (result.rows.length === 0) {
//       console.log(`Post with id ${postId} not found.`);
//       return res.status(404).json({ "error": `Post with id ${postId} not found` });
//     }

//     const deletedPostId = result.rows[0].id;

//     console.log(`Post deleted successfully with id ${deletedPostId}`);
//     res.json({ "status": "success", "data": { id: deletedPostId }, "message": "Post deleted successfully" });
//   } catch (error) {
//     console.error("Error: ", error.message);
//     res.status(500).json({ "error": error.message });
//   } finally {
//     client.release();
//   }
// })

// app.put('/posts/:id', async (req, res) => {
//   const client = await pool.connect();
//   const postId = req.params.id;

//   try {
//     const data = {
//       title: req.body.title,
//       content: req.body.content,
//       author: req.body.author,
//     };

//     const query = 'UPDATE posts SET title = $1, content = $2, author = $3 WHERE id = $4 RETURNING id';
//     const params = [data.title, data.content, data.author, postId];

//     const result = await client.query(query, params);
//     if (result.rowCount === 0) {
//       // If no rows were affected, it means the post with the given ID doesn't exist
//       res.status(404).json({ "error": `Post with id ${postId} not found` });
//     } else {
//       const updatedPostId = result.rows[0].id;

//       console.log(`Post updated successfully with id ${updatedPostId}`);
//       res.json({ "status": "success", "data": data, "message": "Post updated successfully" });
//     }
//   } catch (error) {
//     console.error("Error: ", error.message);
//     res.status(500).json({ "error": error.message });
//   } finally {
//     client.release();
//   }
// })


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
  // res.sendFile(path.join('/home/runner/restful-api-demo' + '/index.html'));
  // res.sendFile('/home/runner/restful-api-demo/index.html'));
}); //let user watch index.html when they go to / or default go to / also if they put nothing


app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname + '/404.html'));
});


app.listen(3000, () => {
  console.log('App is listening on port 3000')
}); // port 3000 is common for API