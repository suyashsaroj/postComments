const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const connection = require('./connection.js');
const http = require('http');
const server = http.createServer(app);


app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, '/../client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/../client/html/index.html'));
})

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.psw;
  let hashPassword = '';
  let userName;
  let userId;
  return new Promise((resolve, reject) => {
    let sql = 'select * from post.user where email=?';
    connection.query(sql, [email], function (err, result) {
      if (err) {
        return res.send({
          success : false,
          message : 'Error in connection. Please contact support team',
          userId: userId,
          userName: userName
        })
        
      }
      let document = result && result[0] ? result[0] : {};
      hashPassword = document && document.password ? document.password : null;
      userName = document && document.name ? document.name : null;
      userId = document && document.id ? document.id : null;
      if (hashPassword) {
        if (bcrypt.compareSync(password, hashPassword)) {
          let sql = 'select * from post.user';
          connection.query(sql, [email], function (err, result) {
            if (err) {
              return res.send({
                success : false,
                message : 'Error in connection. Please contact support team',
                userId: userId,
                userName: userName
              })
            } else {
              return res.send({
                success : true,
                message : '',
                userId: userId,
                userName: userName
              })
            }
          })
        } else {
          return res.send({
            success : false,
            message : 'Password doesnot match. Please enter correct password',
            userId: userId,
            userName: userName
          })
        }
      } else {
        return res.send({
          success : false,
          message : 'User doesnot exist with the given mail',
          userId: userId,
          userName: userName
        })
      }
    });
  })
});


app.post('/registerNewUser', async (req, res) => {
  let email = req.body.email;
  let password = req.body.psw;
  let userName = req.body.uname;
  const hashPassword = bcrypt.hashSync(password, salt);
  let foundEmail = await checkIfEmailExists(email);
  if (foundEmail.length) {
   
    return res.send({
      success : false,
      message : 'User Already exists with the given email. Please signup with a new email'
    })
    
  } else {
    
    let newusercreated = await createNewUser(email, hashPassword, userName);
    if (newusercreated) {
      return res.send({
        success : true,
        message : 'User created'
      })
      
    } else {
      return res.send({
        success : true,
        message : 'Error while registering user' 
      })
      
    }
  }
});

app.post('/showPostsComments', async (req, res) => {
  let postId = req.body.postId;
  let foundPost = await checkIfIdExists(postId);

  if (foundPost) {
    
    let checkId = await joindb(postId);
    var arr=[];
    checkId.forEach(element => arr.push(element.comment));

    res.send({
      success:true,
      post:checkId[0].post,
      comment:arr
    })
  } 
  else{
    res.send({
      success:false
    })
  }
});

app.post('/postCreate', async (req, res) => {
  let post = req.body.post;
  let userName =req.body.username;
  let userId = req.body.id;
  let foundId = await checkIfIdExists(userId);

  if (foundId) {
    let newPost= await createNewPost(post, userId);
 
    if(newPost){
    
    return res.send({
      success : true,
      message : ""
    })
  }
    else {
      return res.send({
        success : false,
        message : "post empty, please add some text to post."
    
      })
        
      }
  } else {
    return res.send({
      success : false,
      message : "user does not exist."
  
    })
      
    }
  
  
});

app.post('/commentCreate', async (req, res) => {
  let comment = req.body.comment;
  let userName =req.body.username;
  let userId = req.body.userId;
  let postId = req.body.postId;
  let foundId = await checkIfIdExists(postId);
 console.log("user : ",userId,"post : ",postId)
  if (foundId) {
    let newPost= await createNewComment(comment, postId, userId);
 
    if(newPost){
    
    return res.send({
      success : true,
      message : "",
      userName : userName
    })
  }
    else {
      return res.send({
        success : false,
        message : "comment empty, please add some text to post."
    
      })
        
      }
  } else {
    return res.send({
      success : false,
      message : "comment does not exist."
  
    })
      
    }
  
  
});

app.delete('/:commentId/commentDelete', async (req, res) => {
  let commentId = parseInt(req.params.commentId);
  let foundId = await checkIfCommentIdExists(commentId);
 
  if (foundId.length) {
   let delComment= await softDeleteComment(commentId);
 
   if(delComment){
   
   return res.send({
     success : true,
     message : ""
   })
 }
}
else {
  return res.send({
    success : false,
    message : "comment does not exist."

  })
    
  }
})


app.delete('/:postId/postDelete', async (req, res) => {
 //let postId= req.params
 let postId = parseInt(req.params.postId);
 let foundId = await checkIfIdExists(postId);

 if (foundId.length) {
  let delPost= await softDeletePost(postId);

  if(delPost){
  
  return res.send({
    success : true,
    message : ""
  })
}
 
} else {
  return res.send({
    success : false,
    message : "post does not exist."

  })
    
  }
});


function softDeleteComment(commentId) {
  return new Promise((resolve, reject) => {
    let sql = ' UPDATE post.comment SET is_active = 0 WHERE id = ?';
    connection.query(sql, [commentId], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })
}

function softDeletePost(postId) {
  return new Promise((resolve, reject) => {
    let sql = ' UPDATE post.post SET is_active = 0 WHERE id = ?';
    connection.query(sql, [postId], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })
}

function checkIfIdExists(postId) {
  return new Promise((resolve, reject) => {
    let sql = 'select * from post.post where id=?';
    connection.query(sql, [postId], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
}


server.listen(3000, () => {
  console.log('Server started at http://localhost:3000');
})

function checkIfEmailExists(email) {
  return new Promise((resolve, reject) => {
    let sql = 'select * from post.user where email=?';
    connection.query(sql, [email], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
}

function createNewUser(email, hashPassword, userName) {
  return new Promise((resolve, reject) => {
    let sql = 'INSERT INTO post.user (email,password,name) values (?,?,?)';
    connection.query(sql, [email, hashPassword, userName], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })
}

function createNewPost(post, userId) {
  return new Promise((resolve, reject) => {
    let sql = 'INSERT INTO post.post (post,fk_id_user,created_date,is_active) values (?,?,?,?)';
    connection.query(sql, [post, userId,new Date() ,1], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })
}
function checkIfIdExists(userId) {
  return new Promise((resolve, reject) => {
    let sql = 'select * from post.post where id=?';
    connection.query(sql, [userId], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
}

function checkIfCommentIdExists(commentId) {
  return new Promise((resolve, reject) => {
    let sql = 'select * from post.comment where id=?';
    connection.query(sql, [commentId], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
}

function createNewComment(comment, postId, userId) {
  return new Promise((resolve, reject) => {
    let sql = 'INSERT INTO post.comment (comment, fk_id_user, fk_id_post,created_date,is_active) values (?,?,?,?,?)';
    connection.query(sql, [comment, userId, postId, new Date() , 1], function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })
}

function joindb(postId) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT post.post,post.is_active , comment.comment,comment.is_active
     FROM post.post INNER JOIN post.comment ON post.post.id=post.comment.fk_id_post WHERE post.id=? AND post.is_active=? AND comment.is_active=?`;
     console.log('sql:',sql);
    connection.query(sql,[parseInt(postId),1,1] , function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })
}