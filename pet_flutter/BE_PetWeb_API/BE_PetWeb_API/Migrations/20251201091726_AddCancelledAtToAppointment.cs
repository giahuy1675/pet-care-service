using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE_PetWeb_API.Migrations
{
    /// <inheritdoc />
    public partial class AddCancelledAtToAppointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Appointments",
                type: "datetime",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Appointments");
        }
    }
}
