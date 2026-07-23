using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BE_PetWeb_API.Models;

public partial class Product
{
    [Key]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(100)]
    
    public string Name { get; set; }

    [Required]
    public string Description { get; set; }

    [Required]
    
    public decimal Price { get; set; }

    [Required]
    [MaxLength(20)]
    
    public string Category { get; set; }

    // Foreign key để liên kết với Categories table
    public int? CategoryId { get; set; }

    [MaxLength(100)]
    
    public string? Brand { get; set; }

    public int StockQuantity { get; set; }

    [MaxLength(255)]
    
    public string? Photo { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? CreatedAt { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? UpdatedAt { get; set; }    public bool? IsActive { get; set; } = true;

    // Navigation property đến Category
    [ForeignKey("CategoryId")]
    public virtual Category? CategoryNavigation { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    
    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
