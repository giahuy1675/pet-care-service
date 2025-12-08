import 'package:flutter/material.dart';
import 'package:pet_flutter/pages/home_page.dart';
import 'package:pet_flutter/pages/profile_page.dart';
import 'package:pet_flutter/pages/pets_page.dart';
import 'package:pet_flutter/pages/appointment_list_page.dart';
import 'package:pet_flutter/pages/enhanced_services_page.dart';
import 'package:persistent_bottom_nav_bar_v2/persistent_bottom_nav_bar_v2.dart';

class ServicesPage extends StatefulWidget {
  const ServicesPage({super.key});
  @override
  State<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends State<ServicesPage> {
  @override
  Widget build(BuildContext context) {
    return const EnhancedServicesPage();
  }
}

class AppointmentsPage extends StatelessWidget {
  const AppointmentsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return const AppointmentListPage();
  }
}

class CartPage extends StatelessWidget {
  const CartPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Giỏ hàng')),
      body: const Center(child: Text('Giỏ hàng')),
    );
  }
}

class RootNav extends StatelessWidget {
  const RootNav({super.key});

  List<PersistentTabConfig> _tabs() => [
        PersistentTabConfig(
          screen: const HomePage(),
          item: ItemConfig(
            icon: const Icon(Icons.home),
            title: "Trang chủ",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const ServicesPage(),
          item: ItemConfig(
            icon: const Icon(Icons.pets),
            title: "Dịch vụ",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const AppointmentsPage(),
          item: ItemConfig(
            icon: const Icon(Icons.calendar_today),
            title: "Lịch hẹn",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const PetsPage(),
          item: ItemConfig(
            icon: const Icon(Icons.favorite),
            title: "Thú cưng",
            activeForegroundColor: Colors.white,
            inactiveForegroundColor: Colors.white70,
          ),
        ),
        PersistentTabConfig(
          screen: const ProfilePage(),
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
