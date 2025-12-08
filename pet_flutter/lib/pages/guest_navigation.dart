import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar_v2/persistent_bottom_nav_bar_v2.dart';
import 'guest_home_page.dart';
import 'guest_services_page.dart';
import 'guest_booking_page.dart';
import 'guest_profile_page.dart';

class GuestNavigation extends StatelessWidget {
  const GuestNavigation({super.key});

  List<PersistentTabConfig> _tabs() => [
        PersistentTabConfig(
          screen: const GuestHomePageContent(),
          item: ItemConfig(
            icon: const Icon(Icons.home),
            title: "Trang chủ",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const GuestServicesPage(),
          item: ItemConfig(
            icon: const Icon(Icons.pets),
            title: "Dịch vụ",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const GuestBookingPage(),
          item: ItemConfig(
            icon: const Icon(Icons.calendar_today),
            title: "Đặt lịch",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const GuestProfilePage(),
          item: ItemConfig(
            icon: const Icon(Icons.person),
            title: "Tài khoản",
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

// Tách content của GuestHomePage để tái sử dụng
class GuestHomePageContent extends StatelessWidget {
  const GuestHomePageContent({super.key});

  @override
  Widget build(BuildContext context) {
    return const GuestHomePage();
  }
}
