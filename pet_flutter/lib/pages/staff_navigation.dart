import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar_v2/persistent_bottom_nav_bar_v2.dart';
import 'staff_dashboard_page.dart';
import 'staff_appointments_page.dart';
import 'staff_schedule_page.dart';
import 'staff_profile_page.dart';
import 'staff_chat_page.dart';

class StaffNavigation extends StatelessWidget {
  const StaffNavigation({super.key});

  List<PersistentTabConfig> _tabs() => [
        PersistentTabConfig(
          screen: const StaffDashboardPage(),
          item: ItemConfig(
            icon: const Icon(Icons.dashboard),
            title: "Tổng quan",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const StaffAppointmentsPage(),
          item: ItemConfig(
            icon: const Icon(Icons.calendar_today),
            title: "Lịch hẹn",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const StaffSchedulePage(),
          item: ItemConfig(
            icon: const Icon(Icons.schedule),
            title: "Ca làm",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const StaffChatPage(),
          item: ItemConfig(
            icon: const Icon(Icons.chat),
            title: "Chat",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const StaffProfilePage(),
          item: ItemConfig(
            icon: const Icon(Icons.person),
            title: "Hồ sơ",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
      ];

  @override
  Widget build(BuildContext context) => PersistentTabView(
        tabs: _tabs(),
        navBarBuilder: (navBarConfig) => Style2BottomNavBar(
          navBarConfig: navBarConfig,
          navBarDecoration: const NavBarDecoration(
            color: Color(0xFF304FFE),
          ),
        ),
      );
}
