const axios = require('axios');
const verifyTokenUrl = process.env.SERVICE_VERIFY_TOKEN;

const validateToken = async (token) => {
  let user;
  await axios
    .post(
      verifyTokenUrl,
      {},
      {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      }
    )
    .then((res) => {
      if (res.status === 200) {
        user = res.data;
      } else {
        console.log('Unauthorized request');
      }
    })
    .catch((err) => {
      if (err.response) {
        console.log(
          `Unauthorized request -> ${token} /// - ${
            err.response.status
          }: ${JSON.stringify(err.response.data)}`
        );
      }
      throw err;
    });
  return user;
};

exports.verifyToken = async (token) => {
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  try {
    return await validateToken(token);
  } catch (err) {
    console.log('Invalid token found, returning undefined');
  }

  return undefined;
};
