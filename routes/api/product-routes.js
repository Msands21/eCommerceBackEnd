const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  Product.findAll({
    include: [{
      model: Category,
      attributes: ['id', 'category_name']
    },
  {
    model:Tag,
    attributes: ['id', 'tag_name'],
    through: ProductTag,
    as: 'product_tags'
  }
  ]
  })
  .then(dataP => {
    if (!dataP) {
      res.status(404).json({ message: 'No products found'});
      return;
    }
    res.json(dataP)
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err)
  });
});

// get one product
router.get('/:id', (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  Product.findOne({
    where: { id: req.params.id },
    include: [
        {
            model: Category,
            attributes: ['id', 'category_name']
        },
        {
            model: Tag,
            attributes: ['id', 'tag_name'],
            through: ProductTag,
            as: 'product_tags'
        }
    ]
})
    .then(dataP => {
        if (!dataP) {
            res.status(404).json({ message: 'No products for this id' });
            return;
        }
        res.json(dbProductData)
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    })
});

// create new product
router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const pTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(pTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((pTagIds) => res.status(200).json(pTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: { id: req.params.id, },
  })
    .then((product) => {
      // finds associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((pTags) => {
      // creates list of current product tag ids
      const pTagIds = pTags.map(({ tag_id }) => tag_id);
      // creates lsit of new tag ids 
      const newPTags = req.body.tagIds
        .filter((tag_id) => !pTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // which ones to remove
      const removePtags = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // updates both remove and create
      return Promise.all([
        ProductTag.destroy({ where: { id: removePtags } }),
        ProductTag.bulkCreate(newPTags),
      ]);
    })
    .then((updatedPTags) => res.json(updatedPTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  Product.destroy({
    where: { id: req.params.id }
  })
  .then (pdata => {
    if(!pdata) {
      res.status(404).json({ message: 'No product for this id'});
      return;
    }
    res.json(pdata);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
});

module.exports = router;
