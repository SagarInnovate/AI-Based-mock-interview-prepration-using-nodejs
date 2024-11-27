

const home = async (req, res) => {
    try {
        res.render('home');
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  };
  
  const about = async (req, res) => {
    try {
        res.render('about');
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  };
  
  const contact = async (req, res) => {
    try {
        res.render('contact');
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  };
  
  module.exports = { home, about, contact};
  