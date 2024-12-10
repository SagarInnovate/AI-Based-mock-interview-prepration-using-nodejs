

const home = async (req, res) => {
    try {
      res.render('pages/home', { title: 'Home' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  };
  



  const about = async (req, res) => {
    try {
      res.render('pages/about', { title: 'About' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  };
  
  const contact = async (req, res) => {
    try {
      res.render('pages/contact', { title: 'Contact' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  };
  
  module.exports = { home, about, contact};
  