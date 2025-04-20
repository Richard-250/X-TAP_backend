import Joi from "joi";

const email = Joi.object({
      email: Joi.string().email().required(),
  });

 const validateEmail = (req, res, next) => {
    const { error } = email.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };


  export default validateEmail