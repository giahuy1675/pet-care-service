using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BE_PetWeb_API.Models;

public partial class Pet
{
    [Key]
    public int PetId { get; set; }

    [Required]
    [ForeignKey("User")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    
    public string Name { get; set; }

    [Required]
    [MaxLength(20)]
    
    public string Species { get; set; }

    [MaxLength(100)]
    
    public string? Breed { get; set; }

    [Required]
    [MaxLength(10)]
    
    public string Gender { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    
    public decimal? Weight { get; set; }

    [MaxLength(50)]
    
    public string? Color { get; set; }

    public string? Description { get; set; }

    [MaxLength(255)]
    
    public string? Photo { get; set; }

    public string? MedicalHistory { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? CreatedAt { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    
    public DateTime? UpdatedAt { get; set; }

    public bool? IsActive { get; set; }

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();

    public virtual ICollection<PetCareReminder> PetCareReminders { get; set; } = new List<PetCareReminder>();

    public virtual ICollection<PetGallery> PetGalleries { get; set; } = new List<PetGallery>();

    public virtual User User { get; set; }

    public virtual ICollection<Vaccination> Vaccinations { get; set; } = new List<Vaccination>();
}
