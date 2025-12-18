import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:pet_flutter/services/pet_service.dart';
import 'package:pet_flutter/services/secure_storage.dart';
import 'package:pet_flutter/pages/edit_pet_page.dart';
import 'package:pet_flutter/pages/add_pet_page.dart';
import 'package:pet_flutter/pages/pet_detail_tabbed_page.dart';
import 'package:pet_flutter/utils/format_utils.dart';
import 'package:pet_flutter/widgets/pet_age_chart.dart';
import 'package:pet_flutter/widgets/shimmer_placeholders.dart';
import 'package:pet_flutter/widgets/avatar_menu.dart';
import 'dart:convert';

class PetsPage extends StatefulWidget {
  const PetsPage({super.key});

  @override
  State<PetsPage> createState() => _PetsPageState();
}

class _PetsPageState extends State<PetsPage> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _items = const [];
  List<Map<String, dynamic>> _filteredItems = const [];
  String? _token;
  String? _username;
  int? _userId;
  String _searchQuery = '';
  String _currentFilter = 'all';
  String _currentSort = 'name';

  @override
  void initState() {
    super.initState();
    _load();
    _loadUserInfo();
  }
  
  Future<void> _loadUserInfo() async {
    final userJson = await SecureStorageService().readUser();
    if (userJson != null) {
      final map = json.decode(userJson) as Map<String, dynamic>;
      setState(() {
        _username = (map['fullName'] as String?) ?? (map['username'] as String?);
        _userId = (map['userId'] as num?)?.toInt();
      });
    }
  }

  Future<void> _load({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      _token = await SecureStorageService().readToken();
      if (_token == null) throw Exception('Bạn chưa đăng nhập');
      final svc = PetService();
      final data = await svc.getUserPets(_token!);
      setState(() {
        _items = data;
        _filteredItems = data;
        _error = null;
      });
      _applyFilters();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
        });
      }
    } finally {
      if (mounted && showLoading) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _refresh() async {
    await _load(showLoading: false);
  }

  void _applyFilters() {
    List<Map<String, dynamic>> filtered = List.from(_items);
    
    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((pet) {
        final name = (pet['name'] as String?) ?? '';
        final species = (pet['species'] as String?) ?? '';
        final breed = (pet['breed'] as String?) ?? '';
        final searchLower = _searchQuery.toLowerCase();
        
        return name.toLowerCase().contains(searchLower) ||
               species.toLowerCase().contains(searchLower) ||
               breed.toLowerCase().contains(searchLower);
      }).toList();
    }
    
    // Apply species filter
    if (_currentFilter != 'all') {
      filtered = filtered.where((pet) {
        final species = (pet['species'] as String?) ?? '';
        return species.toLowerCase() == _currentFilter.toLowerCase();
      }).toList();
    }
    
    // Apply sorting
    filtered.sort((a, b) {
      switch (_currentSort) {
        case 'name':
          final nameA = (a['name'] as String?) ?? '';
          final nameB = (b['name'] as String?) ?? '';
          return nameA.compareTo(nameB);
        case 'species':
          final speciesA = (a['species'] as String?) ?? '';
          final speciesB = (b['species'] as String?) ?? '';
          return speciesA.compareTo(speciesB);
        case 'age':
          final dobA = a['dateOfBirth'] as String?;
          final dobB = b['dateOfBirth'] as String?;
          if (dobA == null && dobB == null) return 0;
          if (dobA == null) return 1;
          if (dobB == null) return -1;
          return DateTime.parse(dobB).compareTo(DateTime.parse(dobA));
        default:
          return 0;
      }
    });
    
    setState(() {
      _filteredItems = filtered;
    });
  }

  void _handleFilter(String value) {
    setState(() {
      _currentFilter = value;
    });
    _applyFilters();
  }

  void _handleSort(String value) {
    setState(() {
      _currentSort = value;
    });
    _applyFilters();
  }

  @override
  Widget build(BuildContext context) {
    final body = _loading
        ? _buildShimmerBody()
        : _error != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red.shade400,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Có lỗi xảy ra',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.red.shade700,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    const SizedBox(height: 8),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _load,
                        icon: const FaIcon(FontAwesomeIcons.arrowsRotate),
                        label: const Text('Thử lại'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : _items.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                  Theme.of(context).colorScheme.primary.withOpacity(0.05),
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                                width: 2,
                              ),
                            ),
                            child: FaIcon(
                              FontAwesomeIcons.paw,
                              size: 48,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const SizedBox(height: 32),
                          Text(
                            'Chưa có thú cưng nào',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: Colors.grey.shade800,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Hãy thêm thú cưng đầu tiên của bạn\nđể bắt đầu chăm sóc',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.grey.shade600,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 32),
                          ElevatedButton.icon(
                            onPressed: () async {
                              final result = await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const AddPetPage(),
                                ),
                              );
                              // Reload pets if a new pet was added
                              if (result == true) {
                                _load();
                              }
                            },
                            icon: const FaIcon(FontAwesomeIcons.plus, size: 16),
                            label: const Text('Thêm thú cưng'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Theme.of(context).colorScheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 2,
                            ),
                          ),
                        ],
                      ),
                ),
              )
            : RefreshIndicator(
                onRefresh: _load,
                child: _filteredItems.isEmpty && _items.isNotEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  shape: BoxShape.circle,
                                ),
                                child: FaIcon(
                                  FontAwesomeIcons.magnifyingGlass,
                                  size: 48,
                                  color: Colors.grey.shade400,
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'Không tìm thấy thú cưng',
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: Colors.grey.shade700,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc',
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton.icon(
                                onPressed: () {
                                  setState(() {
                                    _searchQuery = '';
                                    _currentFilter = 'all';
                                  });
                                  _applyFilters();
                                },
                                icon: const FaIcon(FontAwesomeIcons.rotateLeft, size: 16),
                                label: const Text('Xóa bộ lọc'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Theme.of(context).colorScheme.primary,
                                  foregroundColor: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : Column(
                        children: [
                          // Age Chart
                          if (_items.isNotEmpty && _searchQuery.isEmpty && _currentFilter == 'all')
                            Container(
                              margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                              child: PetAgeChart(pets: _items),
                            ),
                          
                          // Pets List
                          Expanded(
                            child: RefreshIndicator(
                              onRefresh: _refresh,
                              child: ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                                itemCount: _filteredItems.length,
                                itemBuilder: (context, index) {
                                  final p = _filteredItems[index];
                                  final name = (p['name'] as String?) ?? 'Thú cưng';
                                  final photo = (p['photoUrl'] as String?) ?? (p['photo'] as String?);
                                  final species = (p['species'] as String?) ?? '';
                                  final breed = (p['breed'] as String?) ?? '';
                                  final gender = (p['gender'] as String?) ?? '';
                                  final weight = (p['weight'] as num?)?.toDouble();
                                  final dobStr = p['dateOfBirth'] as String?;
                                  
                                  return _buildPetCard(
                                    context,
                                    pet: p,
                                    name: name,
                                    photo: photo,
                                    species: species,
                                    breed: breed,
                                    gender: gender,
                                    weight: weight,
                                    dobStr: dobStr,
                                  );
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                  );

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: TextField(
            onChanged: (value) {
              setState(() {
                _searchQuery = value.toLowerCase();
                _applyFilters();
              });
            },
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Tìm kiếm thú cưng...',
              hintStyle: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 14,
              ),
              prefixIcon: Icon(
                Icons.search,
                size: 20,
                color: Colors.white.withOpacity(0.9),
              ),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: Icon(
                        Icons.clear,
                        size: 18,
                        color: Colors.white.withOpacity(0.9),
                      ),
                      onPressed: () {
                        setState(() {
                          _searchQuery = '';
                          _applyFilters();
                        });
                      },
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).colorScheme.primary,
                Theme.of(context).colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        actions: [
          // Filter and sort menu
          PopupMenuButton<String>(
            icon: Stack(
              children: [
                const FaIcon(FontAwesomeIcons.filter),
                if (_currentFilter != 'all' || _currentSort != 'name')
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
            tooltip: 'Lọc và sắp xếp',
            onSelected: (value) {
              if (value.startsWith('filter_')) {
                _handleFilter(value.substring(7));
              } else if (value.startsWith('sort_')) {
                _handleSort(value.substring(5));
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                enabled: false,
                child: Text(
                  'Lọc theo loài',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              PopupMenuItem(
                value: 'filter_all',
                child: Row(
                  children: [
                    FaIcon(
                      FontAwesomeIcons.paw,
                      size: 16,
                      color: _currentFilter == 'all' ? Theme.of(context).colorScheme.primary : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Tất cả',
                      style: TextStyle(
                        color: _currentFilter == 'all' ? Theme.of(context).colorScheme.primary : null,
                        fontWeight: _currentFilter == 'all' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'filter_dog',
                child: Row(
                  children: [
                    FaIcon(
                      FontAwesomeIcons.dog,
                      size: 16,
                      color: _currentFilter == 'dog' ? Theme.of(context).colorScheme.primary : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Chó',
                      style: TextStyle(
                        color: _currentFilter == 'dog' ? Theme.of(context).colorScheme.primary : null,
                        fontWeight: _currentFilter == 'dog' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'filter_cat',
                child: Row(
                  children: [
                    FaIcon(
                      FontAwesomeIcons.cat,
                      size: 16,
                      color: _currentFilter == 'cat' ? Theme.of(context).colorScheme.primary : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Mèo',
                      style: TextStyle(
                        color: _currentFilter == 'cat' ? Theme.of(context).colorScheme.primary : null,
                        fontWeight: _currentFilter == 'cat' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              PopupMenuItem(
                enabled: false,
                child: Text(
                  'Sắp xếp',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              PopupMenuItem(
                value: 'sort_name',
                child: Row(
                  children: [
                    FaIcon(
                      FontAwesomeIcons.font,
                      size: 16,
                      color: _currentSort == 'name' ? Theme.of(context).colorScheme.primary : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Theo tên',
                      style: TextStyle(
                        color: _currentSort == 'name' ? Theme.of(context).colorScheme.primary : null,
                        fontWeight: _currentSort == 'name' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'sort_species',
                child: Row(
                  children: [
                    FaIcon(
                      FontAwesomeIcons.tags,
                      size: 16,
                      color: _currentSort == 'species' ? Theme.of(context).colorScheme.primary : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Theo loài',
                      style: TextStyle(
                        color: _currentSort == 'species' ? Theme.of(context).colorScheme.primary : null,
                        fontWeight: _currentSort == 'species' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'sort_age',
                child: Row(
                  children: [
                    FaIcon(
                      FontAwesomeIcons.birthdayCake,
                      size: 16,
                      color: _currentSort == 'age' ? Theme.of(context).colorScheme.primary : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Theo tuổi',
                      style: TextStyle(
                        color: _currentSort == 'age' ? Theme.of(context).colorScheme.primary : null,
                        fontWeight: _currentSort == 'age' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Avatar Menu
          AvatarMenu(
            userName: _username,
            userId: _userId,
            token: _token,
          ),
        ],
      ),
      body: body,
      floatingActionButton: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
              spreadRadius: 0,
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          heroTag: "pets_fab",
          onPressed: () async {
            final result = await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const AddPetPage(),
              ),
            );
            // Reload pets if a new pet was added
            if (result == true) {
              _load();
            }
          },
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Colors.white,
          icon: const FaIcon(FontAwesomeIcons.plus, size: 18),
          label: const Text(
            'Thêm thú cưng',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildPetCard(
    BuildContext context, {
    required Map<String, dynamic> pet,
    required String name,
    required String? photo,
    required String species,
    required String breed,
    required String gender,
    required double? weight,
    required String? dobStr,
  }) {
    String age = '';
    if (dobStr != null && dobStr.isNotEmpty) {
      try {
        final dob = DateTime.parse(dobStr);
        final now = DateTime.now();
        final months = (now.difference(dob).inDays / 30).floor();
        if (months >= 12) {
          age = '${(months / 12).floor()} tuổi';
        } else {
          age = '$months tháng';
        }
      } catch (_) {}
    }

    final speciesColor = _getSpeciesColor(species);
    final speciesIcon = _getSpeciesIcon(species);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            spreadRadius: 0,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            _navigateToPetDetail(pet);
          },
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header với avatar và tên - simplified
                Row(
                  children: [
                    // Pet Avatar - simplified
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: speciesColor.withOpacity(0.1),
                      backgroundImage: photo != null ? NetworkImage(photo) : null,
                      child: photo == null
                          ? FaIcon(
                              speciesIcon,
                              color: speciesColor,
                              size: 24,
                            )
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Pet name với emoji
                          Row(
                            children: [
                              Text(
                                _getSpeciesEmoji(species),
                                style: const TextStyle(fontSize: 18),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  name,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          // Species và breed info
                          Text(
                            '${_getSpeciesName(species)}${breed.isNotEmpty ? ' • $breed' : ''}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Pet details - simplified
                Row(
                  children: [
                    // Gender
                    if (gender.isNotEmpty) ...[
                      FaIcon(
                        gender == 'Male' ? FontAwesomeIcons.mars : FontAwesomeIcons.venus,
                        size: 14,
                        color: gender == 'Male' ? Colors.blue : Colors.pink,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        gender == 'Male' ? 'Đực' : 'Cái',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: gender == 'Male' ? Colors.blue : Colors.pink,
                        ),
                      ),
                    ],
                    
                    if (gender.isNotEmpty && age.isNotEmpty) ...[
                      const SizedBox(width: 16),
                      Container(
                        width: 1,
                        height: 16,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(width: 16),
                    ],
                    
                    // Age
                    if (age.isNotEmpty) ...[
                      FaIcon(
                        FontAwesomeIcons.birthdayCake,
                        size: 14,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        age,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.orange,
                        ),
                      ),
                    ],
                    
                    if ((gender.isNotEmpty || age.isNotEmpty) && weight != null) ...[
                      const SizedBox(width: 16),
                      Container(
                        width: 1,
                        height: 16,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(width: 16),
                    ],
                    
                    // Weight
                    if (weight != null) ...[
                      FaIcon(
                        FontAwesomeIcons.weightScale,
                        size: 14,
                        color: Colors.green,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        FormatUtils.formatWeightWithUnit(weight),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 20),
                
                // Action buttons - simplified
                Row(
                  children: [
                    // View details button
                    Expanded(
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                            width: 1.5,
                          ),
                        ),
                        child: TextButton.icon(
                          onPressed: () => _navigateToPetDetail(pet),
                          icon: FaIcon(
                            FontAwesomeIcons.eye,
                            size: 16,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          label: Text(
                            'Chi tiết',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                    // Edit button
                    Container(
                      height: 44,
                      width: 44,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.blue.withOpacity(0.3),
                          width: 1.5,
                        ),
                      ),
                      child: TextButton(
                        onPressed: () async {
                          final changed = await Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => EditPetPage(pet: pet)),
                          );
                          if (changed == true) {
                            _load();
                          }
                        },
                        style: TextButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: FaIcon(
                          FontAwesomeIcons.edit,
                          size: 16,
                          color: Colors.blue,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    
                    // Delete button
                    Container(
                      height: 44,
                      width: 44,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.red.withOpacity(0.3),
                          width: 1.5,
                        ),
                      ),
                      child: TextButton(
                        onPressed: () => _showDeleteDialog(context, pet),
                        style: TextButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: FaIcon(
                          FontAwesomeIcons.trash,
                          size: 16,
                          color: Colors.red,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }


  void _navigateToPetDetail(Map<String, dynamic> pet) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PetDetailTabbedPage(pet: pet),
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, Map<String, dynamic> pet) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.warning, color: Colors.red.shade600),
            const SizedBox(width: 8),
            const Text('Xóa thú cưng'),
          ],
        ),
        content: Text(
          'Bạn chắc chắn muốn xóa "${pet['name']}"? Hành động này không thể hoàn tác.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
                                            try {
                                              final svc = PetService();
                await svc.deletePet(id: (pet['petId'] as num).toInt(), token: _token!);
                                              if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('Đã xóa thú cưng'),
                      backgroundColor: Colors.green.shade600,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  );
                                              }
                                              _load();
                                            } catch (e) {
                                              if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Lỗi: ${e.toString()}'),
                      backgroundColor: Colors.red.shade600,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
            ),
            child: const Text('Xóa'),
                                  ),
                                ],
                              ),
    );
  }

  Color _getSpeciesColor(String species) {
    switch (species.toLowerCase()) {
      case 'dog':
      case 'chó':
        return Colors.orange;
      case 'cat':
      case 'mèo':
        return Colors.purple;
      case 'bird':
      case 'chim':
        return Colors.blue;
      case 'fish':
      case 'cá':
        return Colors.cyan;
      case 'rabbit':
      case 'thỏ':
        return Colors.pink;
      default:
        return Theme.of(context).colorScheme.primary;
    }
  }

  IconData _getSpeciesIcon(String species) {
    switch (species.toLowerCase()) {
      case 'dog':
      case 'chó':
        return FontAwesomeIcons.dog;
      case 'cat':
      case 'mèo':
        return FontAwesomeIcons.cat;
      case 'bird':
      case 'chim':
        return FontAwesomeIcons.dove;
      case 'fish':
      case 'cá':
        return FontAwesomeIcons.fish;
      case 'rabbit':
      case 'thỏ':
        return FontAwesomeIcons.paw;
      default:
        return FontAwesomeIcons.paw;
    }
  }

  String _getSpeciesName(String species) {
    switch (species.toLowerCase()) {
      case 'dog':
      case 'chó':
        return 'Chó';
      case 'cat':
      case 'mèo':
        return 'Mèo';
      case 'bird':
      case 'chim':
        return 'Chim';
      case 'fish':
      case 'cá':
        return 'Cá';
      case 'rabbit':
      case 'thỏ':
        return 'Thỏ';
      default:
        return species.isNotEmpty ? species : 'Khác';
    }
  }

  String _getSpeciesEmoji(String species) {
    switch (species.toLowerCase()) {
      case 'dog':
      case 'chó':
        return '🐶';
      case 'cat':
      case 'mèo':
        return '🐱';
      case 'bird':
      case 'chim':
        return '🐦';
      case 'fish':
      case 'cá':
        return '🐠';
      case 'rabbit':
      case 'thỏ':
        return '🐰';
      default:
        return '🐾';
    }
  }

  Widget _buildShimmerBody() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Search & Filter Bar Shimmer
        Row(
          children: [
            Expanded(
              child: ShimmerInputField(width: double.infinity, height: 56),
            ),
            const SizedBox(width: 12),
            ShimmerButton(width: 56, height: 56, borderRadius: 16),
            const SizedBox(width: 8),
            ShimmerButton(width: 56, height: 56, borderRadius: 16),
          ],
        ),
        const SizedBox(height: 20),
        
        // Stats Cards Shimmer
        Row(
          children: [
            Expanded(
              child: ShimmerCard(
                width: double.infinity,
                height: 100,
                borderRadius: 16,
                margin: const EdgeInsets.only(right: 8),
              ),
            ),
            Expanded(
              child: ShimmerCard(
                width: double.infinity,
                height: 100,
                borderRadius: 16,
                margin: const EdgeInsets.only(left: 8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        
        // Section Title Shimmer
        ShimmerText(width: 150, height: 24, margin: const EdgeInsets.only(bottom: 16)),
        
        // Pet Cards Shimmer
        ...List.generate(3, (index) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Container(
            height: 140,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  spreadRadius: 1,
                  blurRadius: 4,
                ),
              ],
            ),
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                ShimmerAvatar(size: 100),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ShimmerText(width: 120, height: 20),
                      const SizedBox(height: 8),
                      ShimmerText(width: 80, height: 16),
                      const SizedBox(height: 8),
                      ShimmerText(width: 100, height: 16),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          ShimmerButton(width: 40, height: 32, borderRadius: 8),
                          const SizedBox(width: 8),
                          ShimmerButton(width: 40, height: 32, borderRadius: 8),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        )),
      ],
    );
  }
}


