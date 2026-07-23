using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BE_PetWeb_API.Models;

public partial class BlogPost
{
    [Key]
    public int PostId { get; set; }

    [Required]
    [ForeignKey("User")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(200)]
    
    public string Title { get; set; }

    [Required]
    public string Content { get; set; }

    [MaxLength(255)]
    
    public string? FeaturedImage { get; set; }

    [Required]
    [MaxLength(100)]
    
    public string Category { get; set; }

    public string? Tags { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? PublishDate { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? UpdatedAt { get; set; }

    [Required]
    [MaxLength(20)]
    
    public string Status { get; set; } = "Draft";

    public int? ViewCount { get; set; } = 0;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual User User { get; set; }
}
