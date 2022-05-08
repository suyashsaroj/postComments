const connection = require('./connection.js');
var newPromise = new Promise((resolve, reject) => {
  connectDatabase()
    .then(() => {
      return createDatabase();
    })
    .then(() => {
      return createUserTable();
    })
    .then(() => {
      return createPostTable();
    })
    .then(() => {
      return createCommentTable();
    })
    .then(() => {
      return createParentChildCommentTable();
    })
    .then(resolve)
    .catch(reject);
});
function connectDatabase() {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        return reject(err);
      } else {
        console.log('DATABASE CONNECTED SUCCESSFULLY')
        return resolve();
      }
    })
  });
}
function createDatabase() {
  return new Promise((resolve, reject) => {
    connection.query(`CREATE DATABASE IF NOT EXISTS post`, (err) => {
      if (err) {
        return reject(err);
      } else {
        console.log('CREATED DATABASE SUCCESSFULLY')
        return resolve();
      }
    })
  });
}
function createUserTable() {
  return new Promise((resolve, reject) => {
    connection.query(`CREATE TABLE IF NOT EXISTS post.user (id int(11) NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL , 
    email varchar(255) NOT NULL , password varchar(255) NOT NULL, PRIMARY KEY (id))`, (err) => {
      if (err) {
        return reject(err);
      } else {
        console.log('CREATED USER TABLE SUCCESSFULLY')
        return resolve();
      }
    })
  });
}
function createPostTable() {
  return new Promise((resolve, reject) => {
    connection.query(`CREATE TABLE IF NOT EXISTS post.post (id int(11) NOT NULL AUTO_INCREMENT, created_date DATE NOT NULL , 
    post varchar(255) NOT NULL,fk_id_user int(11) NOT NULL,is_active BOOLEAN NOT NULL, PRIMARY KEY (id), FOREIGN KEY (fk_id_user) REFERENCES user(id))`, (err) => {
      if (err) {
        return reject(err);
      } else {
        console.log('CREATED POST TABLE SUCCESSFULLY')
        return resolve();
      }
    })
  });
}
function createCommentTable() {
  return new Promise((resolve, reject) => {
    connection.query(`CREATE TABLE IF NOT EXISTS post.comment (id int(11) NOT NULL AUTO_INCREMENT, created_date DATE NOT NULL , comment varchar(255) NOT NULL,
    fk_id_user int(11) NOT NULL, fk_id_post int(11) NOT NULL, PRIMARY KEY (id), 
    is_active BOOLEAN NOT NULL, FOREIGN KEY (fk_id_user) REFERENCES user(id), FOREIGN KEY (fk_id_post) REFERENCES post(id))`, (err) => {
      if (err) {
        return reject(err);
      } else {
        console.log('CREATED COMMENT TABLE SUCCESSFULLY')
        return resolve();
      }
    })
  });
}
function createParentChildCommentTable() {
  return new Promise((resolve, reject) => {
    connection.query(`CREATE TABLE IF NOT EXISTS post.parent_child_comment (id int(11) NOT NULL AUTO_INCREMENT, fk_id_parent_comment int(11) NOT NULL,  
    fk_id_child_comment int(11) NOT NULL, PRIMARY KEY (id), FOREIGN KEY (fk_id_parent_comment) REFERENCES comment(id), FOREIGN KEY (fk_id_child_comment) REFERENCES comment(id))`, (err) => {
      if (err) {
        return reject(err);
      } else {
        console.log('CREATED PARENT_CHILD_TABLE SUCCESSFULLY')
        return resolve();
      }
    })
  });
}
newPromise
  .then(() => {
    return Promise.resolve();
  })
  .then(() => {
    return process.exit(0)
  })
  .catch((err) => {
    return Promise.reject(err);
  })
