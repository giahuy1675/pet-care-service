using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BE_PetWeb_API.Models;

public partial class Service
{
    [Key]
    public int ServiceId { get; set; }

    [Required]
    [MaxLength(100)]
    
    public string Name { get; set; }

    [Required]
    public string Description { get; set; }

    [Required]
    
    public decimal Price { get; set; }

    public int Duration { get; set; }

    [Required]
    [MaxLength(20)]
    
    public string Category { get; set; }

    [MaxLength(255)]
    
    public string? Photo { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? CreatedAt { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? UpdatedAt { get; set; }

    public bool? IsActive { get; set; } = true;

    public int ViewCount { get; set; } = 0;

    public int BookingCount { get; set; } = 0;

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<StaffService> StaffServices { get; set; } = new List<StaffService>();
}
