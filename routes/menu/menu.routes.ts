import Router from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the menu API' });
});

router.get('/:id', (_req, res) => {
  // Logic to fetch menu items from the database
  res.json({ items: [] }); // Placeholder response
});

router.post('/', (_req, res) => {
  // Logic to create a new menu item in the database
  res.json({ message: 'Menu item created successfully' });
});
router.patch('/:id', (_req, res) => {
  // Logic to update a menu item in the database
  res.json({ message: 'Menu item updated successfully' });
});
router.delete('/:id',(req,res)=>{
  // Logic to delete a menu item from the database
  res.json({ message: 'Menu item deleted successfully' });
})

export { router };



export default Router;